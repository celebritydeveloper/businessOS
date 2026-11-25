<?php

declare(strict_types=1);

namespace App\Core\Billing;

use App\Core\Billing\Contracts\PaymentGatewayInterface;
use App\Core\Billing\Gateways\FlutterwaveGateway;
use App\Core\Billing\Gateways\PaystackGateway;
use App\Core\Http\JsonResponder;
use App\Core\Security\AuditLogger;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Ramsey\Uuid\Uuid;
use RuntimeException;
use Throwable;

final class BillingController {
    public function __construct(
        private PDO $pdo,
        private PaystackGateway $paystack,
        private FlutterwaveGateway $flutterwave,
        private AuditLogger $audit
    ) {
    }

    public function listPlans(Request $request, Response $response): Response {
        $stmt = $this->pdo->query("
            SELECT id, name, slug, description, price_monthly, price_yearly, currency, trial_hours, limits_json
            FROM plans
            WHERE is_active = 1
            ORDER BY sort_order ASC
        ");

        $plans = array_map(static function (array $row): array {
            $row['limits'] = json_decode((string) $row['limits_json'], true) ?: [];
            unset($row['limits_json']);
            return $row;
        }, $stmt->fetchAll());
        return JsonResponder::success($response, ['plans' => $plans]);
    }

    public function initializeCheckout(Request $request, Response $response): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $body = (array) ($request->getParsedBody() ?? []);
        $planSlug = trim((string) ($body['plan_slug'] ?? ''));
        $cycle = ($body['billing_cycle'] ?? 'monthly') === 'yearly' ? 'yearly' : 'monthly';
        $gatewayName = strtolower(trim((string) ($body['gateway'] ?? 'paystack')));
        $callbackUrl = trim((string) ($body['callback_url'] ?? 'http://localhost:5173/billing/callback'));

        if (!in_array($gatewayName, ['paystack', 'flutterwave'], true)) {
            return JsonResponder::error($response, 'Invalid payment gateway. Choose paystack or flutterwave.', 'INVALID_GATEWAY', 422);
        }

        $accStmt = $this->pdo->prepare("SELECT email FROM accounts WHERE id = :aid LIMIT 1");
        $accStmt->execute([':aid' => $accountId]);
        $email = (string) $accStmt->fetchColumn();
        $planStmt = $this->pdo->prepare("SELECT * FROM plans WHERE slug = :slug AND is_active = 1 LIMIT 1");
        $planStmt->execute([':slug' => $planSlug]);
        $plan = $planStmt->fetch();

        if (!$plan || $email === '') {
            return JsonResponder::error($response, 'Selected plan not found.', 'PLAN_NOT_FOUND', 404);
        }

        $amount = $cycle === 'yearly' ? (float) $plan['price_yearly'] : (float) $plan['price_monthly'];
        $reference = 'BOS-' . strtoupper(bin2hex(random_bytes(8)));
        $subStmt = $this->pdo->prepare("SELECT id FROM subscriptions WHERE account_id = :aid ORDER BY created_at DESC LIMIT 1");
        $subStmt->execute([':aid' => $accountId]);
        $subscriptionId = (string) $subStmt->fetchColumn();

        if ($subscriptionId === '') {
            $subscriptionId = Uuid::uuid4()->toString();
            $this->pdo->prepare("
                INSERT INTO subscriptions (id, account_id, plan_id, billing_cycle, status, gateway)
                VALUES (:id, :aid, :pid, :cycle, 'pending_payment', :gw)
            ")->execute([
                ':id'    => $subscriptionId,
                ':aid'   => $accountId,
                ':pid'   => $plan['id'],
                ':cycle' => $cycle,
                ':gw'    => $gatewayName,
            ]);
        }

        $txId = Uuid::uuid4()->toString();
        $this->pdo->prepare("
            INSERT INTO payment_transactions (id, account_id, subscription_id, gateway, reference, amount, currency, status)
            VALUES (:id, :aid, :sid, :gw, :ref, :amt, :curr, 'pending')
        ")->execute([
            ':id'   => $txId,
            ':aid'  => $accountId,
            ':sid'  => $subscriptionId,
            ':gw'   => $gatewayName,
            ':ref'  => $reference,
            ':amt'  => $amount,
            ':curr' => $plan['currency'],
        ]);

        try {
            $gateway = $this->resolveGateway($gatewayName);
            $checkout = $gateway->initialize($email, $amount, $reference, $callbackUrl, [
                'account_id'      => $accountId,
                'subscription_id' => $subscriptionId,
                'plan_id'         => $plan['id'],
                'billing_cycle'   => $cycle,
            ]);

            $this->audit->log($accountId, 'billing.checkout_initialized', $userId, null, null, 'payment', $txId, null, [
                'gateway'   => $gatewayName,
                'reference' => $reference,
                'amount'    => $amount,
            ]);

            return JsonResponder::success($response, $checkout);
        } catch (Throwable $e) {
            return JsonResponder::error($response, $e->getMessage(), 'GATEWAY_ERROR', 502);
        }
    }

    public function verifyCallback(Request $request, Response $response): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $params = $request->getQueryParams();
        $reference = trim((string) ($params['reference'] ?? $params['tx_ref'] ?? ''));

        if ($reference === '') {
            return JsonResponder::error($response, 'Transaction reference is required.', 'MISSING_REFERENCE', 422);
        }

        $txStmt = $this->pdo->prepare("SELECT * FROM payment_transactions WHERE reference = :ref AND account_id = :aid LIMIT 1");
        $txStmt->execute([':ref' => $reference, ':aid' => $accountId]);
        $tx = $txStmt->fetch();

        if (!$tx) {
            return JsonResponder::error($response, 'Transaction not found.', 'TX_NOT_FOUND', 404);
        }

        if ($tx['status'] === 'success') {
            return JsonResponder::success($response, ['verified' => true, 'status' => 'active']);
        }

        $gateway = $this->resolveGateway((string) $tx['gateway']);
        $result = $gateway->verify($reference);

        if (!$result['paid'] || $result['amount'] < (float) $tx['amount']) {
            return JsonResponder::error($response, 'Payment has not been confirmed yet.', 'PAYMENT_UNVERIFIED', 402);
        }

        $this->activatePaidTransaction($tx, (string) $result['gateway_id'], $result['raw']);
        return JsonResponder::success($response, ['verified' => true, 'status' => 'active']);
    }

    public function handleWebhook(Request $request, Response $response, array $args): Response  {
        $gatewayName = strtolower((string) ($args['gateway'] ?? ''));
        if (!in_array($gatewayName, ['paystack', 'flutterwave'], true)) {
            return JsonResponder::error($response, 'Unsupported webhook gateway.', 'INVALID_GATEWAY', 400);
        }

        $rawBody = (string) $request->getBody();
        $headers = array_change_key_case(array_map(static fn(array $v): string => $v[0] ?? '', $request->getHeaders()), CASE_LOWER);
        $gateway = $this->resolveGateway($gatewayName);
        if (!$gateway->isValidWebhook($rawBody, $headers)) {
            return JsonResponder::error($response, 'Invalid webhook signature.', 'INVALID_SIGNATURE', 401);
        }

        $payload = json_decode($rawBody, true) ?: [];
        $reference = $gatewayName === 'paystack' ? (string) ($payload['data']['reference'] ?? '') : (string) ($payload['data']['tx_ref'] ?? '');
        $isSuccessEvent = $gatewayName === 'paystack' ? (($payload['event'] ?? '') === 'charge.success') : (($payload['event'] ?? '') === 'charge.completed' && (($payload['data']['status'] ?? '') === 'successful'));

        if ($reference !== '' && $isSuccessEvent) {
            $txStmt = $this->pdo->prepare("SELECT * FROM payment_transactions WHERE reference = :ref LIMIT 1");
            $txStmt->execute([':ref' => $reference]);
            $tx = $txStmt->fetch();

            if ($tx && $tx['status'] !== 'success') {
                $gatewayTxId = (string) ($payload['data']['id'] ?? '');
                $this->activatePaidTransaction($tx, $gatewayTxId, $payload);
            }
        }

        return JsonResponder::success($response, ['received' => true]);
    }

    public function overview(Request $request, Response $response): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');

        if (!$isOwner) {
            return JsonResponder::error($response, 'Only the account owner can manage billing.', 'FORBIDDEN', 403);
        }

        $subStmt = $this->pdo->prepare("
            SELECT s.id, s.status, s.billing_cycle, s.trial_ends_at, s.current_period_end, s.grace_until, s.gateway,
                   p.name AS plan_name, p.slug AS plan_slug, p.price_monthly, p.price_yearly, p.currency
            FROM subscriptions s
            INNER JOIN plans p ON p.id = s.plan_id
            WHERE s.account_id = :aid
            ORDER BY s.created_at DESC LIMIT 1
        ");
        $subStmt->execute([':aid' => $accountId]);
        $subscription = $subStmt->fetch() ?: null;

        $txStmt = $this->pdo->prepare("
            SELECT id, gateway, reference, amount, currency, status, raw_payload_json, verified_at, created_at
            FROM payment_transactions
            WHERE account_id = :aid
            ORDER BY created_at DESC
            LIMIT 25
        ");
        $txStmt->execute([':aid' => $accountId]);
        $rows = $txStmt->fetchAll();

        $paymentMethod = null;
        $invoices = [];

        foreach ($rows as $row) {
            $raw = json_decode((string) ($row['raw_payload_json'] ?? '{}'), true) ?: [];
            if ($paymentMethod === null && $row['status'] === 'success') {
                $auth = $raw['data']['authorization'] ?? $raw['data']['card'] ?? null;
                if (is_array($auth)) {
                    $paymentMethod = [
                        'gateway'   => $row['gateway'],
                        'brand'     => strtoupper((string) ($auth['brand'] ?? $auth['card_type'] ?? $auth['type'] ?? 'CARD')),
                        'last4'     => (string) ($auth['last4'] ?? $auth['last_4digits'] ?? '****'),
                        'exp_month' => (string) ($auth['exp_month'] ?? ''),
                        'exp_year'  => (string) ($auth['exp_year'] ?? ''),
                        'bank'      => (string) ($auth['bank'] ?? $auth['issuer'] ?? ''),
                    ];
                }
            }

            $invoices[] = [
                'id'          => $row['id'],
                'reference'   => $row['reference'],
                'gateway'     => $row['gateway'],
                'amount'      => (float) $row['amount'],
                'currency'    => $row['currency'],
                'status'      => $row['status'],
                'paid_at'     => $row['verified_at'],
                'created_at'  => $row['created_at'],
            ];
        }

        return JsonResponder::success($response, [
            'subscription'   => $subscription,
            'payment_method' => $paymentMethod,
            'invoices'       => $invoices,
        ]);
    }


    private function activatePaidTransaction(array $tx, string $gatewayTxId, array $rawPayload): void {
        $this->pdo->beginTransaction();
        try {
            $this->pdo->prepare("
                UPDATE payment_transactions
                SET status = 'success', gateway_tx_id = :gtx, raw_payload_json = :raw, verified_at = UTC_TIMESTAMP()
                WHERE id = :id AND status != 'success'
            ")->execute([
                ':gtx' => $gatewayTxId,
                ':raw' => json_encode($rawPayload, JSON_UNESCAPED_UNICODE),
                ':id'  => $tx['id'],
            ]);

            $subStmt = $this->pdo->prepare("SELECT billing_cycle FROM subscriptions WHERE id = :sid LIMIT 1");
            $subStmt->execute([':sid' => $tx['subscription_id']]);
            $cycle = (string) ($subStmt->fetchColumn() ?: 'monthly');
            $interval = $cycle === 'yearly' ? '+1 year' : '+1 month';
            $periodStart = gmdate('Y-m-d H:i:s');
            $periodEnd = gmdate('Y-m-d H:i:s', strtotime($interval));
            $graceUntil = gmdate('Y-m-d H:i:s', strtotime($interval . ' +72 hours'));
            $planId = $rawPayload['data']['metadata']['plan_id'] ?? $rawPayload['data']['meta']['plan_id'] ?? null;
            $sql = $planId ? "UPDATE subscriptions SET plan_id = :pid, status = 'active', current_period_start = :start, current_period_end = :end, grace_until = :grace, gateway = :gw, last_payment_ref = :ref WHERE id = :sid" : "UPDATE subscriptions SET status = 'active', current_period_start = :start, current_period_end = :end, grace_until = :grace, gateway = :gw, last_payment_ref = :ref WHERE id = :sid";

            $params = [
                ':start' => $periodStart,
                ':end'   => $periodEnd,
                ':grace' => $graceUntil,
                ':gw'    => $tx['gateway'],
                ':ref'   => $tx['reference'],
                ':sid'   => $tx['subscription_id'],
            ];
            if ($planId) {
                $params[':pid'] = $planId;
            }

            $this->pdo->prepare($sql)->execute($params);
            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }

        $this->audit->log($tx['account_id'], 'billing.subscription_activated', null, null, null, 'subscription', $tx['subscription_id'], null, [
            'reference' => $tx['reference'],
            'gateway'   => $tx['gateway'],
            'amount'    => $tx['amount'],
        ]);
    }

    private function resolveGateway(string $gateway): PaymentGatewayInterface {
        return match ($gateway) {
            'paystack'    => $this->paystack,
            'flutterwave' => $this->flutterwave,
            default       => throw new RuntimeException('Unsupported payment gateway.'),
        };
    }
}
