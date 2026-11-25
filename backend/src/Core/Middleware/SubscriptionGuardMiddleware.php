<?php

declare(strict_types=1);

namespace App\Core\Middleware;

use App\Core\Http\JsonResponder;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as Handler;
use Slim\Psr7\Response as SlimResponse;

final class SubscriptionGuardMiddleware implements MiddlewareInterface {
    public function __construct(private PDO $pdo) {}

    public function process(Request $request, Handler $handler): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');

        $stmt = $this->pdo->prepare("
            SELECT s.*, p.slug AS plan_slug, p.limits_json
            FROM subscriptions s
            INNER JOIN plans p ON p.id = s.plan_id
            WHERE s.account_id = :aid
            ORDER BY s.created_at DESC LIMIT 1
        ");
        $stmt->execute([':aid' => $accountId]);
        $sub = $stmt->fetch();

        if (!$sub) {
            return JsonResponder::error(new SlimResponse(), 'Complete business onboarding first.', 'ONBOARDING_REQUIRED', 402);
        }

        $now = time();
        $isAllowed = false;

        if ($sub['status'] === 'trialing' && !empty($sub['trial_ends_at']) && strtotime($sub['trial_ends_at']) > $now) {
            $isAllowed = true;
        } elseif ($sub['status'] === 'active' && !empty($sub['current_period_end']) && strtotime($sub['current_period_end']) > $now) {
            $isAllowed = true;
        } elseif (!empty($sub['grace_until']) && strtotime($sub['grace_until']) > $now) {
            $isAllowed = true;
        }

        if (!$isAllowed) {
            return JsonResponder::error(
                new SlimResponse(),
                'Your 24-hour trial or subscription has ended. Please complete payment to continue.',
                'SUBSCRIPTION_REQUIRED',
                402,
                ['subscription_status' => $sub['status'], 'plan_slug' => $sub['plan_slug']]
            );
        }

        $request = $request
            ->withAttribute('subscription', $sub)
            ->withAttribute('plan_limits', json_decode((string) $sub['limits_json'], true) ?: []);

        return $handler->handle($request);
    }
}
