<?php

declare(strict_types=1);

namespace App\Core\Security;

use RuntimeException;

final class CryptoService {
    private string $encKey;

    public function __construct(string $rawEncryptionKey) {
        $this->encKey = hash('sha256', $rawEncryptionKey, true);
    }

    public function hashSecret(string $plain): string {
        return password_hash($plain, PASSWORD_ARGON2ID, [
            'memory_cost' => 65536,
            'time_cost'   => 4,
            'threads'     => 2,
        ]);
    }

    public function verifySecret(string $plain, string $hash): bool {
        return password_verify($plain, $hash);
    }

    public function encryptField(?string $plaintext): ?string {
        if ($plaintext === null || $plaintext === '') {
            return null;
        }
        $iv = random_bytes(12);
        $tag = '';
        $ciphertext = openssl_encrypt($plaintext, 'aes-256-gcm', $this->encKey, OPENSSL_RAW_DATA, $iv, $tag);
        if ($ciphertext === false) {
            throw new RuntimeException('Encryption failure.');
        }
        return base64_encode($iv . $tag . $ciphertext);
    }

    public function decryptField(?string $encoded): ?string {
        if ($encoded === null || $encoded === '') {
            return null;
        }
        $raw = base64_decode($encoded, true);
        if ($raw === false || strlen($raw) < 28) {
            return null;
        }
        $iv = substr($raw, 0, 12);
        $tag = substr($raw, 12, 16);
        $ciphertext = substr($raw, 28);
        $plain = openssl_decrypt($ciphertext, 'aes-256-gcm', $this->encKey, OPENSSL_RAW_DATA, $iv, $tag);
        return $plain === false ? null : $plain;
    }

    public function fingerprint(string $deviceId, string $userAgent = ''): string {
        return hash('sha256', trim($deviceId));
    }
}
