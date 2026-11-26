<?php

declare(strict_types=1);

namespace App\Core\Contacts;

use App\Core\Http\JsonResponder;
use App\Core\Security\AuditLogger;
use App\Core\Security\PermissionService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Throwable;

final class CustomerController
{
    public function __construct(
        private CustomerService $service,
        private PermissionService $perms,
        private AuditLogger $audit
    ) {}

    public function list(Request $request, Response $response, array $args): Response
    {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $businessId = (string) ($args['businessId'] ?? '');
        $search = trim((string) ($request->getQueryParams()['q'] ?? ''));

        if (
            !$this->perms->hasPermission($userId, $isOwner, $businessId, 'pos.sell')
            && !$this->perms->hasPermission($userId, $isOwner, $businessId, 'contacts.manage')
        ) {
            return JsonResponder::error($response, 'Access denied.', 'FORBIDDEN', 403);
        }

        return JsonResponder::success($response, [
            'customers' => $this->service->list($accountId, $businessId, $search),
        ]);
    }

    public function create(Request $request, Response $response, array $args): Response
    {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $businessId = (string) ($args['businessId'] ?? '');
        $body = (array) ($request->getParsedBody() ?? []);

        if (
            !$this->perms->hasPermission($userId, $isOwner, $businessId, 'pos.sell')
            && !$this->perms->hasPermission($userId, $isOwner, $businessId, 'contacts.manage')
        ) {
            return JsonResponder::error($response, 'Access denied.', 'FORBIDDEN', 403);
        }

        $name = trim((string) ($body['full_name'] ?? ''));
        if ($name === '') {
            return JsonResponder::error($response, 'Customer full name is required.', 'VALIDATION_ERROR', 422);
        }

        $id = $this->service->create($businessId, [
            'full_name'    => $name,
            'phone'        => trim((string) ($body['phone'] ?? '')),
            'email'        => trim((string) ($body['email'] ?? '')),
            'address'      => trim((string) ($body['address'] ?? '')),
            'credit_limit' => (float) ($body['credit_limit'] ?? 0),
            'notes'        => trim((string) ($body['notes'] ?? '')),
        ]);

        $this->audit->log($accountId, 'contacts.customer_created', $userId, $businessId, null, 'customer', $id);
        return JsonResponder::success($response, ['customer_id' => $id], 201);
    }

    public function update(Request $request, Response $response, array $args): Response
    {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $businessId = (string) ($args['businessId'] ?? '');
        $customerId = (string) ($args['customerId'] ?? '');
        $body = (array) ($request->getParsedBody() ?? []);

        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'contacts.manage')) {
            return JsonResponder::error($response, 'You do not have permission to edit customers.', 'FORBIDDEN', 403);
        }

        $name = trim((string) ($body['full_name'] ?? ''));
        if ($name === '') {
            return JsonResponder::error($response, 'Customer full name is required.', 'VALIDATION_ERROR', 422);
        }

        $this->service->update($businessId, $customerId, [
            'full_name'    => $name,
            'phone'        => trim((string) ($body['phone'] ?? '')),
            'email'        => trim((string) ($body['email'] ?? '')),
            'address'      => trim((string) ($body['address'] ?? '')),
            'credit_limit' => (float) ($body['credit_limit'] ?? 0),
            'notes'        => trim((string) ($body['notes'] ?? '')),
        ]);

        $this->audit->log($accountId, 'contacts.customer_updated', $userId, $businessId, null, 'customer', $customerId);
        return JsonResponder::success($response, ['updated' => true]);
    }

    public function recordPayment(Request $request, Response $response, array $args): Response
    {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $businessId = (string) ($args['businessId'] ?? '');
        $customerId = (string) ($args['customerId'] ?? '');
        $body = (array) ($request->getParsedBody() ?? []);

        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'contacts.manage')) {
            return JsonResponder::error($response, 'Access denied.', 'FORBIDDEN', 403);
        }

        $amount = round((float) ($body['amount'] ?? 0), 2);
        $payCode = ($body['payment_account_code'] ?? '1000') === '1010' ? '1010' : '1000';
        $branchId = trim((string) ($body['branch_id'] ?? ''));
        $notes = trim((string) ($body['notes'] ?? ''));

        if ($amount <= 0) {
            return JsonResponder::error($response, 'Enter a positive payment amount.', 'VALIDATION_ERROR', 422);
        }

        try {
            $this->service->recordPayment($businessId, $branchId, $customerId, $userId, $amount, $payCode, $notes);
        } catch (Throwable $e) {
            return JsonResponder::error($response, $e->getMessage(), 'CUSTOMER_PAYMENT_ERROR', 422);
        }

        $this->audit->log($accountId, 'contacts.customer_payment', $userId, $businessId, $branchId ?: null, 'customer', $customerId, null, ['amount' => $amount]);
        return JsonResponder::success($response, ['recorded' => true], 201);
    }
}
