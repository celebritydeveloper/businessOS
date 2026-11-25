<?php

declare(strict_types=1);

namespace App\Core\Billing\Contracts;

interface PaymentGatewayInterface {
    public function initialize(string $email, float $amountNgn, string $reference, string $callbackUrl, array $metadata = []): array;
    public function verify(string $reference): array;
    public function isValidWebhook(string $rawBody, array $headers): bool;
}
