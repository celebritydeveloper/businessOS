<?php

declare(strict_types=1);

namespace App\Core\Billing\Gateways;

use App\Core\Billing\Contracts\PaymentGatewayInterface;
use RuntimeException;

final class FlutterwaveGateway implements PaymentGatewayInterface {
    public function __construct(
        private string $secretKey,
        private string $webhookHash
    ) {}

    public function initialize(string $email, float $amountNgn, string $reference, string $callbackUrl, array $metadata = []): array {
        $payload = json_encode([
            'tx_ref'       => $reference,
            'amount'       => $amountNgn,
            'currency'     => 'NGN',
            'redirect_url' => $callbackUrl,
            'customer'     => ['email' => $email],
            'meta'         => $metadata,
        ]);

        $res = $this->request('POST', 'https://flutterwave.com', $payload);
        if (($res['status'] ?? '') !== 'success' || empty($res['data']['link'])) {
            throw new RuntimeException($res['message'] ?? 'Flutterwave initialization failed.');
        }

        return [
            'checkout_url' => $res['data']['link'],
            'reference'    => $reference,
        ];
    }

    public function verify(string $reference): array {
        $res = $this->request('GET', 'https://flutterwave.com' . rawurlencode($reference));
        $paid = (($res['status'] ?? '') === 'success') && (($res['data']['status'] ?? '') === 'successful');

        return [
            'paid'       => $paid,
            'amount'     => (float) ($res['data']['amount'] ?? 0),
            'gateway_id' => (string) ($res['data']['id'] ?? ''),
            'raw'        => $res,
        ];
    }

    public function isValidWebhook(string $rawBody, array $headers): bool
    {
        $sig = $headers['verif-hash'] ?? '';
        if ($sig === '' || $this->webhookHash === '') {
            return false;
        }
        return hash_equals($this->webhookHash, $sig);
    }

    private function request(string $method, string $url, ?string $body = null): array {
        $ch = curl_init($url);
        $opts = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 20,
            CURLOPT_HTTPHEADER     => [
                'Authorization: Bearer ' . $this->secretKey,
                'Content-Type: application/json',
            ],
        ];
        if ($method === 'POST') {
            $opts[CURLOPT_POST] = true;
            $opts[CURLOPT_POSTFIELDS] = $body ?? '{}';
        }
        curl_setopt_array($ch, $opts);
        $raw = curl_exec($ch);
        curl_close($ch);

        return is_string($raw) ? (json_decode($raw, true) ?: []) : [];
    }
}
