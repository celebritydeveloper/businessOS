<?php

declare(strict_types=1);

namespace App\Core\Auth;

use App\Core\Http\JsonResponder;
use App\Core\Notifications\MailerService;
use App\Core\Security\AuditLogger;
use App\Core\Security\CryptoService;
use App\Core\Security\RateLimiter;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Ramsey\Uuid\Uuid;
use Throwable;


final class AuthController {
    public function __construct(
        private PDO $pdo,
        private CryptoService $crypto,
        private SessionAuthService $sessions,
        private RateLimiter $rateLimiter,
        private AuditLogger $audit,
        private MailerService $mailer
    ) {
    }

    private function clientIp(Request $request): string {
        return (string) ($request->getServerParams()['REMOTE_ADDR'] ?? '0.0.0.0');
    }


    public function register(Request $request, Response $response): Response {
        $ip = $this->clientIp($request);
        if ($this->rateLimiter->isLocked("reg:{$ip}")) {
            return JsonResponder::error($response, 'Too many signup attempts. Try again later.', 'RATE_LIMITED', 429);
        }

        $body = (array) $request->getParsedBody();
        $ownerName = trim((string) ($body['owner_name'] ?? ''));
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $phone = trim((string) ($body['phone'] ?? ''));
        $password = (string) ($body['password'] ?? '');

        if ($ownerName === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) {
            $this->rateLimiter->hit("reg:{$ip}", 10, 900, 900);
            return JsonResponder::error($response, 'Provide valid owner name, email, and a password of at least 8 characters.', 'VALIDATION_ERROR', 422);
        }

        $exists = $this->pdo->prepare("SELECT id FROM accounts WHERE email = :email LIMIT 1");
        $exists->execute([':email' => $email]);
        if ($exists->fetch()) {
            $this->rateLimiter->hit("reg:{$ip}", 10, 900, 900);
            return JsonResponder::error($response, 'An account with this email already exists.', 'EMAIL_TAKEN', 409);
        }

        $otp = (string) random_int(100000, 999999);
        $otpHash = hash('sha256', $otp);
        $otpExpires = gmdate('Y-m-d H:i:s', time() + 900); // 15 minutes
        $accountId = Uuid::uuid4()->toString();
        $userId = Uuid::uuid4()->toString();
        $passHash = $this->crypto->hashSecret($password);

        $this->pdo->beginTransaction();
        try {
            $this->pdo->prepare("
                INSERT INTO accounts (id, owner_name, email, email_verification_code_hash, email_verification_expires_at, phone, password_hash)
                VALUES (:id, :name, :email, :otp, :exp, :phone, :pass)
            ")->execute([
                ':id'    => $accountId,
                ':name'  => $ownerName,
                ':email' => $email,
                ':otp'   => $otpHash,
                ':exp'   => $otpExpires,
                ':phone' => $phone !== '' ? $phone : null,
                ':pass'  => $passHash,
            ]);

            $this->pdo->prepare("
                INSERT INTO users (id, account_id, full_name, email, phone, password_hash, is_owner)
                VALUES (:uid, :aid, :name, :email, :phone, :pass, 1)
            ")->execute([
                ':uid'   => $userId,
                ':aid'   => $accountId,
                ':name'  => $ownerName,
                ':email' => $email,
                ':phone' => $phone !== '' ? $phone : null,
                ':pass'  => $passHash,
            ]);

            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }

        $this->mailer->sendVerificationCode($email, $ownerName, $otp);
        $this->audit->log($accountId, 'auth.registered', $userId, null, null, 'account', $accountId, null, ['email' => $email], null, $ip);

        return JsonResponder::success($response, [
            'next_step' => 'verify_email',
            'email'     => $email,
            'message'   => 'Verification code sent to your email.',
        ], 201);
    }

    public function verifyEmail(Request $request, Response $response): Response {
        $body = (array) $request->getParsedBody();
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $code = trim((string) ($body['code'] ?? ''));
        $ip = $this->clientIp($request);

        if ($this->rateLimiter->isLocked("otp:{$email}")) {
            return JsonResponder::error($response, 'Too many invalid attempts. Request a new code later.', 'RATE_LIMITED', 429);
        }

        $stmt = $this->pdo->prepare("
            SELECT a.*, u.id AS owner_user_id, u.full_name, u.is_owner
            FROM accounts a
            INNER JOIN users u ON u.account_id = a.id AND u.is_owner = 1
            WHERE a.email = :email LIMIT 1
        ");
        $stmt->execute([':email' => $email]);
        $acc = $stmt->fetch();

        if (!$acc || empty($acc['email_verification_code_hash']) || empty($acc['email_verification_expires_at'])) {
            $this->rateLimiter->hit("otp:{$email}", 5, 900, 900);
            return JsonResponder::error($response, 'Invalid verification request.', 'INVALID_OTP', 400);
        }

        if (strtotime($acc['email_verification_expires_at']) <= time()) {
            return JsonResponder::error($response, 'Verification code has expired. Please request a new one.', 'OTP_EXPIRED', 400);
        }

        if (!hash_equals($acc['email_verification_code_hash'], hash('sha256', $code))) {
            $this->rateLimiter->hit("otp:{$email}", 5, 900, 900);
            return JsonResponder::error($response, 'Incorrect verification code.', 'INVALID_OTP', 400);
        }

        $this->pdo->prepare("
            UPDATE accounts
            SET email_verified_at = UTC_TIMESTAMP(), email_verification_code_hash = NULL, email_verification_expires_at = NULL
            WHERE id = :id
        ")->execute([':id' => $acc['id']]);

        $this->rateLimiter->clear("otp:{$email}");

        $deviceId = $request->getHeaderLine('X-Device-ID') ?: Uuid::uuid4()->toString();
        $deviceName = (string) ($body['device_name'] ?? 'Web POS');
        $ua = $request->getHeaderLine('User-Agent');

        $tokens = $this->sessions->issueSession([
            'id'         => $acc['owner_user_id'],
            'account_id' => $acc['id'],
            'is_owner'   => 1,
        ], $deviceId, $deviceName, $ip, $ua);

        $this->audit->log($acc['id'], 'auth.email_verified', $acc['owner_user_id'], null, null, 'account', $acc['id'], null, null, $deviceId, $ip);

        $response = $this->attachRefreshCookie($response, $tokens['refresh_token']);

        return JsonResponder::success($response, [
            'next_step'    => 'onboarding',
            'access_token' => $tokens['access_token'],
            'expires_in'   => $tokens['expires_in'],
            'device_id'    => $deviceId,
        ]);
    }

    public function resendVerification(Request $request, Response $response): Response {
        $body = (array) $request->getParsedBody();
        $email = strtolower(trim((string) ($body['email'] ?? '')));

        if ($this->rateLimiter->isLocked("resend:{$email}")) {
            return JsonResponder::error($response, 'Please wait before requesting another code.', 'RATE_LIMITED', 429);
        }
        $this->rateLimiter->hit("resend:{$email}", 1, 60, 60);

        $stmt = $this->pdo->prepare("SELECT id, owner_name, email_verified_at FROM accounts WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        $acc = $stmt->fetch();

        if ($acc && empty($acc['email_verified_at'])) {
            $otp = (string) random_int(100000, 999999);
            $this->pdo->prepare("
                UPDATE accounts
                SET email_verification_code_hash = :otp, email_verification_expires_at = :exp
                WHERE id = :id
            ")->execute([
                ':otp' => hash('sha256', $otp),
                ':exp' => gmdate('Y-m-d H:i:s', time() + 900),
                ':id'  => $acc['id'],
            ]);
            $this->mailer->sendVerificationCode($email, $acc['owner_name'], $otp);
        }

        return JsonResponder::success($response, ['message' => 'If your email is unverified, a new code has been sent.']);
    }

    public function login(Request $request, Response $response): Response {
        $body = (array) ($request->getParsedBody() ?? []);
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $password = (string) ($body['password'] ?? '');
        $ip = $request->getServerParams()['REMOTE_ADDR'] ?? '0.0.0.0';

        $rateKey = 'login:' . hash('sha256', $email . '|' . $ip);
        if ($this->rateLimiter->isLocked($rateKey)) {
            return JsonResponder::error($response, 'Too many failed attempts. Try again later.', 'RATE_LIMITED', 429);
        }

        $stmt = $this->pdo->prepare("
            SELECT u.*, a.email_verified_at, a.status AS account_status
            FROM users u
            INNER JOIN accounts a ON a.id = u.account_id
            WHERE u.email = :email AND u.is_active = 1 LIMIT 1
        ");
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        // Constant-time check even when email doesn't exist (prevents email enumeration)
        $dummyHash = '$argon2id$v=19$m=65536,t=4,p=2$dGVzdHNhbHQxMjM0NTY3OA$0000000000000000000000000000000000000000000';
        $valid = $user && !empty($user['password_hash']) ? $this->crypto->verifySecret($password, (string) $user['password_hash']) : $this->crypto->verifySecret($password, $dummyHash) && false;

        if (!$valid) {
            $this->rateLimiter->hit($rateKey, 5, 900, 900);
            return JsonResponder::error($response, 'Invalid email or password.', 'INVALID_CREDENTIALS', 401);
        }

        $this->rateLimiter->clear($rateKey);

        if (empty($user['email_verified_at'])) {
            return JsonResponder::error($response, 'Please verify your email before logging in.', 'EMAIL_NOT_VERIFIED', 403, [
                'next_step' => 'verify_email',
                'email'     => $email,
            ]);
        }

        $deviceId = $request->getHeaderLine('X-Device-ID') ?: Uuid::uuid4()->toString();
        $deviceName = $request->getHeaderLine('X-Device-Name') ?: 'Web Browser';
        $ua = $request->getHeaderLine('User-Agent');

        $tokens = $this->sessions->issueSession($user, $deviceId, $deviceName, $ip, $ua);

        $this->pdo->prepare("UPDATE users SET last_login_at = UTC_TIMESTAMP() WHERE id = :id")->execute([':id' => $user['id']]);
        $this->audit->log($user['account_id'], 'auth.login', $user['id'], null, null, 'user', $user['id'], null, null, $deviceId, $ip);

        $response = $this->attachRefreshCookie($response, $tokens['refresh_token']);

        return JsonResponder::success($response, [
            'access_token' => $tokens['access_token'],
            'expires_in'   => $tokens['expires_in'],
            'session_id'   => $tokens['session_id'],
            'user'         => [
                'id'       => $user['id'],
                'name'     => $user['full_name'],
                'is_owner' => (bool) $user['is_owner'],
            ],
        ]);
    }


    public function refresh(Request $request, Response $response): Response {
        $cookies = $request->getCookieParams();
        $rawRefresh = (string) ($cookies['bos_refresh'] ?? '');
        if ($rawRefresh === '') {
            return JsonResponder::error($response, 'Refresh token missing.', 'UNAUTHENTICATED', 401);
        }

        $deviceId = $request->getHeaderLine('X-Device-ID') ?: '';
        $ua = $request->getHeaderLine('User-Agent');
        $ip = $request->getServerParams()['REMOTE_ADDR'] ?? '0.0.0.0';

        try {
            $tokens = $this->sessions->rotateRefreshToken($rawRefresh, $deviceId, $ua, $ip);
            $response = $this->attachRefreshCookie($response, $tokens['refresh_token']);

            return JsonResponder::success($response, [
                'access_token' => $tokens['access_token'],
                'expires_in'   => $tokens['expires_in'],
            ]);
        } catch (Throwable) {
            return JsonResponder::error($response, 'Session expired or revoked.', 'SESSION_INVALID', 401);
        }
    }

    public function logout(Request $request, Response $response): Response{
        $sessionId = (string) $request->getAttribute('auth_session_id');
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');

        if ($sessionId !== '' && $accountId !== '') {
            $this->sessions->revokeSession($sessionId, $accountId);
            $this->audit->log($accountId, 'auth.logout', $userId, null, null, 'session', $sessionId);
        }

        $secure = ($_ENV['APP_ENV'] ?? 'local') !== 'local' ? '; Secure' : '';
        $response = $response->withAddedHeader('Set-Cookie', "bos_refresh=; Path=/api/v1/auth; HttpOnly; SameSite=Strict; Max-Age=0{$secure}");

        return JsonResponder::success($response, ['logged_out' => true]);
    }

    private function attachRefreshCookie(Response $response, string $refreshToken): Response {
        $isProd = ($_ENV['APP_ENV'] ?? 'local') !== 'local';
        $flags = $isProd ? '; Secure; SameSite=None' : '; SameSite=Lax';
        $maxAge = 2592000;
        return $response->withAddedHeader(
            'Set-Cookie',
            "bos_refresh={$refreshToken}; Path=/; HttpOnly; Max-Age={$maxAge}{$flags}"
        );
    }
}
