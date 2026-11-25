<?php

declare(strict_types=1);
namespace App\Core\Auth;

use App\Core\Security\CryptoService;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use PDO;
use Ramsey\Uuid\Uuid;
use RuntimeException;

final class SessionAuthService {
    private const REFRESH_TTL_SECONDS = 2592000; // 30 days
    private const ACCESS_TTL_SECONDS = 28800; // 8 hours (1 POS shift)


    public function __construct(
        private PDO $pdo,
        private CryptoService $crypto,
        private string $jwtSecret
    ) {}

    public function issueSession(array $user, string $deviceId, string $deviceName, string $ipAddress, string $userAgent): array {
        $sessionId = Uuid::uuid4()->toString();
        $rawRefresh = bin2hex(random_bytes(32));
        $refreshHash = hash('sha256', $rawRefresh);
        $fingerprint = $this->crypto->fingerprint($deviceId, $userAgent);
        $expiresAt = gmdate('Y-m-d H:i:s', time() + self::REFRESH_TTL_SECONDS);

        $stmt = $this->pdo->prepare("
            INSERT INTO user_sessions
            (id, user_id, account_id, refresh_token_hash, device_id, device_fingerprint_hash, device_name, ip_address, user_agent, expires_at)
            VALUES (:id, :uid, :aid, :rhash, :did, :fp, :dname, :ip, :ua, :exp)
        ");
        $stmt->execute([
            ':id'    => $sessionId,
            ':uid'   => $user['id'],
            ':aid'   => $user['account_id'],
            ':rhash' => $refreshHash,
            ':did'   => $deviceId,
            ':fp'    => $fingerprint,
            ':dname' => substr($deviceName, 0, 150),
            ':ip'    => $ipAddress,
            ':ua'    => substr($userAgent, 0, 255),
            ':exp'   => $expiresAt,
        ]);

        return [
            'access_token'  => $this->mintAccessToken($user, $sessionId, $fingerprint),
            'expires_in'    => self::ACCESS_TTL_SECONDS,
            'refresh_token' => $rawRefresh,
            'session_id'    => $sessionId,
        ];
    }

    public function rotateRefreshToken(string $rawRefreshToken, string $deviceId, string $userAgent, string $ipAddress): array {
        $hash = hash('sha256', $rawRefreshToken);
        $stmt = $this->pdo->prepare("
            SELECT s.*, u.account_id, u.full_name, u.email, u.is_owner, u.is_active AS user_active
            FROM user_sessions s
            INNER JOIN users u ON u.id = s.user_id
            WHERE s.refresh_token_hash = :h LIMIT 1
        ");
        $stmt->execute([':h' => $hash]);
        $session = $stmt->fetch();

        if (!$session || (int) $session['is_revoked'] === 1 || (int) $session['user_active'] !== 1) {
            throw new RuntimeException('Session revoked or invalid.');
        }
        if (strtotime($session['expires_at']) <= time()) {
            throw new RuntimeException('Session expired.');
        }

        $expectedFp = $this->crypto->fingerprint($deviceId, $userAgent);
        if (!hash_equals($session['device_fingerprint_hash'], $expectedFp)) {
            $this->revokeSession($session['id'], $session['account_id']);
            throw new RuntimeException('Device fingerprint mismatch. Session terminated.');
        }

        $newRawRefresh = bin2hex(random_bytes(32));
        $newHash = hash('sha256', $newRawRefresh);
        $newExp = gmdate('Y-m-d H:i:s', time() + self::REFRESH_TTL_SECONDS);

        $upd = $this->pdo->prepare("
            UPDATE user_sessions
            SET refresh_token_hash = :nh, ip_address = :ip, last_active_at = UTC_TIMESTAMP(), expires_at = :exp
            WHERE id = :id
        ");
        $upd->execute([
            ':nh'  => $newHash,
            ':ip'  => $ipAddress,
            ':exp' => $newExp,
            ':id'  => $session['id'],
        ]);

        return [
            'access_token'  => $this->mintAccessToken($session, $session['id'], $expectedFp),
            'expires_in'    => self::ACCESS_TTL_SECONDS,
            'refresh_token' => $newRawRefresh,
            'session_id'    => $session['id'],
        ];
    }

    public function verifyAccessToken(string $jwt, string $deviceId, string $userAgent): array {
        $decoded = (array) JWT::decode($jwt, new Key($this->jwtSecret, 'HS256'));

        if ($deviceId !== '' && $deviceId !== 'unknown-device' && isset($decoded['fp'])) {
            $expectedFp = $this->crypto->fingerprint($deviceId, $userAgent);
            if (!hash_equals((string) $decoded['fp'], $expectedFp)) {
                throw new RuntimeException('Token device binding mismatch.');
            }
        }

        return $decoded;
    }


    public function revokeSession(string $sessionId, string $accountId): void {
        $stmt = $this->pdo->prepare("UPDATE user_sessions SET is_revoked = 1 WHERE id = :id AND account_id = :aid");
        $stmt->execute([':id' => $sessionId, ':aid' => $accountId]);
    }

    private function mintAccessToken(array $user, string $sessionId, string $fingerprint): string {
        $now = time();
        $payload = [
            'iss'      => 'business-os',
            'iat'      => $now,
            'exp'      => $now + self::ACCESS_TTL_SECONDS,
            'sub'      => $user['user_id'] ?? $user['id'],
            'acc'      => $user['account_id'],
            'sid'      => $sessionId,
            'is_owner' => (bool) $user['is_owner'],
            'fp'       => $fingerprint,
        ];
        return JWT::encode($payload, $this->jwtSecret, 'HS256');
    }
}
