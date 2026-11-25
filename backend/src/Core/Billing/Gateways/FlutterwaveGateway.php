<?php

declare(strict_types=1);

namespace App\Core\Billing\Gateways;

use App\Core\Billing\Contracts\PaymentGatewayInterface;
use RuntimeException;

final class FlutterwaveGateway implements PaymentGatewayInterface {
    private const API_BASE = 'https://api.flutterwave.com/v3';

    public function __construct(private string $secretKey) {}

    public function initialize(
        string $email,
        float $amount,
        string $reference,
        string $callbackUrl,
        array $metadata = []
    ): array {
        $payload = [
            'tx_ref'       => $reference,
            'amount'       => $amount,
            'currency'     => strtoupper((string) ($metadata['currency'] ?? 'NGN')),
            'redirect_url' => $callbackUrl,
            'customer'     => [
                'email' => $email,
                'name'  => (string) ($metadata['customer_name'] ?? 'BusinessOS Merchant'),
            ],
            'customizations' => [
                'title'       => 'BusinessOS Subscription',
                'description' => 'Plan Upgrade (' . ucfirst((string) ($metadata['billing_cycle'] ?? 'monthly')) . ')',
            ],
            'meta' => $metadata,
        ];

        $gatewayPlanId = trim((string) ($metadata['gateway_plan_id'] ?? ''));
        if ($gatewayPlanId !== '') {
            $payload['payment_plan'] = $gatewayPlanId;
        }

        $data = $this->request('POST', '/payments', $payload);
        $checkoutUrl = (string) ($data['data']['link'] ?? '');
        if ($checkoutUrl === '') {
            throw new RuntimeException('Flutterwave response missing checkout link.');
        }

        return [
            'authorization_url' => $checkoutUrl,
            'reference'         => $reference,
        ];
    }


    public function verify(string $reference): array {
        $encodedRef = urlencode($reference);
        $data = $this->request('GET', "/transactions/verify_by_reference?tx_ref={$encodedRef}");
        $tx = (array) ($data['data'] ?? []);

        $isSuccess = strtolower((string) ($tx['status'] ?? '')) === 'successful';

        return [
            'verified'    => $isSuccess,
            'status'      => $isSuccess ? 'success' : 'failed',
            'amount'      => (float) ($tx['amount'] ?? 0),
            'currency'    => (string) ($tx['currency'] ?? 'NGN'),
            'raw_payload' => $data,
        ];
    }

    public function isValidWebhook(string $rawBody, array $headers): bool {
        $expectedHash = (string) ($_ENV['FLUTTERWAVE_WEBHOOK_HASH'] ?? '');
        if ($expectedHash === '') {
            return false;
        }
        $signature = (string) ($headers['verif-hash'] ?? $headers['Verif-Hash'] ?? '');
        return $signature !== '' && hash_equals($expectedHash, $signature);
    }

    private function request(string $method, string $path, ?array $body = null): array {
        $ch = curl_init(self::API_BASE . $path);
        $options = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_HTTPHEADER     => [
                'Authorization: Bearer ' . trim($this->secretKey),
                'Content-Type: application/json',
                'Accept: application/json',
            ],
        ];

        if ($method === 'POST') {
            $options[CURLOPT_POST] = true;
            $options[CURLOPT_POSTFIELDS] = json_encode($body ?? []);
        }

        curl_setopt_array($ch, $options);
        $raw = curl_exec($ch);
        $curlErr = curl_error($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);

        if ($raw === false) {
            throw new RuntimeException('Flutterwave network error: ' . $curlErr);
        }

        $decoded = json_decode($raw, true);
        if ($httpCode >= 400 || !is_array($decoded) || ($decoded['status'] ?? '') !== 'success') {
            $msg = is_array($decoded)
                ? (string) ($decoded['message'] ?? json_encode($decoded))
                : substr(trim($raw), 0, 200);
            throw new RuntimeException("Flutterwave ({$httpCode}): {$msg}");
        }

        return $decoded;
    }
}
