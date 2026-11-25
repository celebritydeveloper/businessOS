<?php

declare(strict_types=1);

namespace App\Core\Security;
use PDO;

final class RateLimiter {
    public function __construct(private PDO $pdo) {}

    public function isLocked(string $key): bool {
        $stmt = $this->pdo->prepare("SELECT locked_until FROM security_rate_limits WHERE rate_key = :k LIMIT 1");
        $stmt->execute([':k' => $key]);
        $row = $stmt->fetch();
        if (!$row || empty($row['locked_until'])) {
            return false;
        }
        return strtotime($row['locked_until']) > time();
    }

    public function hit(string $key, int $maxAttempts = 5, int $windowSeconds = 900, int $lockSeconds = 900): bool {
        $now = gmdate('Y-m-d H:i:s');
        $stmt = $this->pdo->prepare("SELECT attempts, window_starts_at FROM security_rate_limits WHERE rate_key = :k LIMIT 1");
        $stmt->execute([':k' => $key]);
        $row = $stmt->fetch();

        if (!$row || (time() - strtotime($row['window_starts_at'])) > $windowSeconds) {
            $up = $this->pdo->prepare("
                REPLACE INTO security_rate_limits (rate_key, attempts, window_starts_at, locked_until)
                VALUES (:k, 1, :now, NULL)
            ");
            $up->execute([':k' => $key, ':now' => $now]);
            return false;
        }

        $attempts = (int) $row['attempts'] + 1;
        $lockedUntil = $attempts >= $maxAttempts ? gmdate('Y-m-d H:i:s', time() + $lockSeconds) : null;

        $up = $this->pdo->prepare("
            UPDATE security_rate_limits
            SET attempts = :att, locked_until = :lock
            WHERE rate_key = :k
        ");
        $up->execute([':att' => $attempts, ':lock' => $lockedUntil, ':k' => $key]);

        return $lockedUntil !== null;
    }

    public function clear(string $key): void {
        $stmt = $this->pdo->prepare("DELETE FROM security_rate_limits WHERE rate_key = :k");
        $stmt->execute([':k' => $key]);
    }
}
