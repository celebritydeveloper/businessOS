<?php

declare(strict_types=1);
namespace App\Core\Billing\Gateways;
use App\Core\Billing\Contracts\PaymentGatewayInterface;
use RuntimeException;

final class PaystackGateway implements PaymentGatewayInterface {
    public function __construct(private string $secretKey) {}

    public function initialize(string $email, float $amountNgn, string $reference, string $callbackUrl, array $metadata = []): array {

        $gatewayPlanCode = trim((string) ($metadata['gateway_plan_id'] ?? ''));
        if ($gatewayPlanCode !== '') {
            $payload['plan'] = $gatewayPlanCode;
        }

        
        $payload = json_encode([
            'email'        => $email,
            'amount'       => (int) round($amountNgn * 100), // kobo
            'reference'    => $reference,
            'callback_url' => $callbackUrl,
            'metadata'     => $metadata,
        ]);

        $res = $this->request('POST', 'https://paystack.co', $payload);
        if (empty($res['status']) || empty($res['data']['authorization_url'])) {
            throw new RuntimeException($res['message'] ?? 'Paystack initialization failed.');
        }

        return [
            'checkout_url' => $res['data']['authorization_url'],
            'reference'    => $reference,
        ];
    }

    public function verify(string $reference): array {
        $res = $this->request('GET', 'https://paystack.co' . rawurlencode($reference));
        $paid = !empty($res['status']) && (($res['data']['status'] ?? '') === 'success');

        return [
            'paid'       => $paid,
            'amount'     => isset($res['data']['amount']) ? ((float) $res['data']['amount'] / 100) : 0.0,
            'gateway_id' => (string) ($res['data']['id'] ?? ''),
            'raw'        => $res,
        ];
    }

    public function isValidWebhook(string $rawBody, array $headers): bool {
        $sig = $headers['x-paystack-signature'] ?? '';
        if ($sig === '' || $this->secretKey === '') {
            return false;
        }
        $computed = hash_hmac('sha512', $rawBody, $this->secretKey);
        return hash_equals($computed, $sig);
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
        $curlErr = curl_error($ch);
        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $redirectUrl = (string) curl_getinfo($ch, CURLINFO_REDIRECT_URL);

        if ($raw === false) {
            throw new RuntimeException('Flutterwave connection error: ' . $curlErr);
        }

        $data = json_decode($raw, true);
        if ($httpCode >= 400 || $httpCode === 301 || $httpCode === 302 || ($data['status'] ?? '') !== 'success') {
            $detail = is_array($data)
                ? json_encode($data['errors'] ?? $data['message'] ?? $data)
                : ($redirectUrl !== '' ? "Redirected to {$redirectUrl}" : substr(trim($raw), 0, 250));

            throw new RuntimeException("Flutterwave error ({$httpCode}): {$detail}");
        }

        return is_string($raw) ? (json_decode($raw, true) ?: []) : [];
    }
}
