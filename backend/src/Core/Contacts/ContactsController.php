<?php

declare(strict_types=1);

namespace App\Core\Contacts;

use App\Core\Http\JsonResponder;
use App\Core\Security\AuditLogger;
use App\Core\Security\PermissionService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Throwable;

final class ContactsController
{
    public function __construct(
        private ContactsService $service,
        private PermissionService $perms,
        private AuditLogger $audit
    ) {}

    public function listCustomers(Request $request, Response $response, array $args): Response
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
            'customers' => $this->service->listCustomers($accountId, $businessId, $search),
        ]);
    }

    public function createCustomer(Request $request, Response $response, array $args): Response
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

        $id = $this->service->createCustomer($businessId, [
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

    public function recordCustomerPayment(Request $request, Response $response, array $args): Response
    {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $businessId = (string) ($args['businessId'] ?? '');
        $customerId = (string) ($args['customerId'] ?? '');
        $body = (array) ($request->getParsedBody() ?? []);

        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'contacts.manage')) {
            return JsonResponder::error($response, 'You do not have permission to record debt repayments.', 'FORBIDDEN', 403);
        }

        $amount = round((float) ($body['amount'] ?? 0), 2);
        $paymentCode = ($body['payment_account_code'] ?? '1000') === '1010' ? '1010' : '1000';
        $branchId = trim((string) ($body['branch_id'] ?? ''));
        $notes = trim((string) ($body['notes'] ?? ''));

        if ($amount <= 0) {
            return JsonResponder::error($response, 'Enter a positive payment amount.', 'VALIDATION_ERROR', 422);
        }

        try {
            $this->service->recordCustomerPayment($businessId, $branchId, $customerId, $userId, $amount, $paymentCode, $notes);
        } catch (Throwable $e) {
            return JsonResponder::error($response, $e->getMessage(), 'CUSTOMER_PAYMENT_ERROR', 422);
        }

        $this->audit->log($accountId, 'contacts.customer_payment', $userId, $businessId, $branchId ?: null, 'customer', $customerId, null, ['amount' => $amount]);
        return JsonResponder::success($response, ['recorded' => true], 201);
    }

    public function listSuppliers(Request $request, Response $response, array $args): Response
    {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $businessId = (string) ($args['businessId'] ?? '');
        $search = trim((string) ($request->getQueryParams()['q'] ?? ''));

        if (
            !$this->perms->hasPermission($userId, $isOwner, $businessId, 'contacts.manage')
            && !$this->perms->hasPermission($userId, $isOwner, $businessId, 'inventory.restock')
        ) {
            return JsonResponder::error($response, 'Access denied.', 'FORBIDDEN', 403);
        }

        return JsonResponder::success($response, [
            'suppliers' => $this->service->listSuppliers($accountId, $businessId, $search),
        ]);
    }

    public function createSupplier(Request $request, Response $response, array $args): Response
    {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $businessId = (string) ($args['businessId'] ?? '');
        $body = (array) ($request->getParsedBody() ?? []);

        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'contacts.manage')) {
            return JsonResponder::error($response, 'Access denied.', 'FORBIDDEN', 403);
        }

        $name = trim((string) ($body['name'] ?? ''));
        if ($name === '') {
            return JsonResponder::error($response, 'Supplier name is required.', 'VALIDATION_ERROR', 422);
        }

        $id = $this->service->createSupplier($businessId, [
            'name'           => $name,
            'contact_person' => trim((string) ($body['contact_person'] ?? '')),
            'phone'          => trim((string) ($body['phone'] ?? '')),
            'email'          => trim((string) ($body['email'] ?? '')),
            'address'        => trim((string) ($body['address'] ?? '')),
            'bank_details'   => trim((string) ($body['bank_details'] ?? '')),
            'notes'          => trim((string) ($body['notes'] ?? '')),
        ]);

        $this->audit->log($accountId, 'contacts.supplier_created', $userId, $businessId, null, 'supplier', $id);
        return JsonResponder::success($response, ['supplier_id' => $id], 201);
    }

    public function recordSupplierActivity(Request $request, Response $response, array $args): Response
    {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $businessId = (string) ($args['businessId'] ?? '');
        $supplierId = (string) ($args['supplierId'] ?? '');
        $body = (array) ($request->getParsedBody() ?? []);

        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'contacts.manage')) {
            return JsonResponder::error($response, 'Access denied.', 'FORBIDDEN', 403);
        }

        $txType = ($body['tx_type'] ?? 'supplier_payment') === 'supplier_bill' ? 'supplier_bill' : 'supplier_payment';
        $amount = round((float) ($body['amount'] ?? 0), 2);
        $paymentCode = ($body['payment_account_code'] ?? '1010') === '1000' ? '1000' : '1010';
        $branchId = trim((string) ($body['branch_id'] ?? ''));
        $notes = trim((string) ($body['notes'] ?? ''));

        if ($amount <= 0) {
            return JsonResponder::error($response, 'Enter a positive amount.', 'VALIDATION_ERROR', 422);
        }

        try {
            $this->service->recordSupplierActivity($businessId, $branchId, $supplierId, $userId, $txType, $amount, $paymentCode, $notes);
        } catch (Throwable $e) {
            return JsonResponder::error($response, $e->getMessage(), 'SUPPLIER_TX_ERROR', 422);
        }

        $this->audit->log($accountId, "contacts.{$txType}", $userId, $businessId, $branchId ?: null, 'supplier', $supplierId, null, ['amount' => $amount]);
        return JsonResponder::success($response, ['recorded' => true], 201);
    }
}
