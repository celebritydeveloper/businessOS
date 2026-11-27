<?php

declare(strict_types=1);

namespace App\Core\Creative;

use App\Core\Http\JsonResponder;
use App\Core\Security\AuditLogger;
use App\Core\Security\PermissionService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Throwable;

final class CreativeProjectController {
    public function __construct(
        private CreativeProjectService $projects,
        private CreativeBillingService $billing,
        private PermissionService $perms,
        private AuditLogger $audit,
        private ProjectClientNotifier $notifier
    ) {}


    public function list(Request $request, Response $response, array $args): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $businessId = (string) ($args['businessId'] ?? '');
        $branchId = (string) ($args['branchId'] ?? '');

        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'projects.manage')) {
            return JsonResponder::error($response, 'Access denied.', 'FORBIDDEN', 403);
        }

        return JsonResponder::success($response, [
            'projects' => $this->projects->listProjects($accountId, $businessId, $branchId),
        ]);
    }

    public function create(Request $request, Response $response, array $args): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $businessId = (string) ($args['businessId'] ?? '');
        $branchId = (string) ($args['branchId'] ?? '');
        $body = (array) ($request->getParsedBody() ?? []);

        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'projects.manage')) {
            return JsonResponder::error($response, 'Access denied.', 'FORBIDDEN', 403);
        }

        $title = trim((string) ($body['title'] ?? ''));
        if ($title === '') {
            return JsonResponder::error($response, 'Project title is required.', 'VALIDATION_ERROR', 422);
        }

        $id = $this->projects->createProject($businessId, $branchId, $userId, [
            'customer_id'        => trim((string) ($body['customer_id'] ?? '')),
            'title'              => $title,
            'project_type'       => (string) ($body['project_type'] ?? 'fixed_project'),
            'contract_amount'    => (float) ($body['contract_amount'] ?? 0),
            'revisions_included' => (int) ($body['revisions_included'] ?? 3),
            'due_date'           => trim((string) ($body['due_date'] ?? '')),
            'notes'              => trim((string) ($body['notes'] ?? '')),
        ]);

        $this->audit->log($accountId, 'creative.project_created', $userId, $businessId, $branchId, 'creative_project', $id);
        $this->notifier->notify($id, 'Project Kickoff & Tracking Link', 'Your project has been scheduled. Use the link below to follow live progress anytime.');

        return JsonResponder::success($response, ['project_id' => $id], 201);
    }


    public function updateStage(Request $request, Response $response, array $args): Response {
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $businessId = (string) ($args['businessId'] ?? '');
        $projectId = (string) ($args['projectId'] ?? '');
        $body = (array) ($request->getParsedBody() ?? []);
        $stage = (string) ($body['stage'] ?? '');

        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'projects.manage')) {
            return JsonResponder::error($response, 'Access denied.', 'FORBIDDEN', 403);
        }

        try {
            $this->projects->updateStage($businessId, $projectId, $stage);
        } catch (Throwable $e) {
            return JsonResponder::error($response, $e->getMessage(), 'PROJECT_STAGE_ERROR', 422);
        }

        $label = ucwords(str_replace('_', ' ', $stage));
        $this->notifier->notify($projectId, 'Project Stage Updated', "Your project has moved to stage: {$label}.");

        return JsonResponder::success($response, ['updated' => true]);
    }

    public function addLog(Request $request, Response $response, array $args): Response {
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $businessId = (string) ($args['businessId'] ?? '');
        $branchId = (string) ($args['branchId'] ?? '');
        $projectId = (string) ($args['projectId'] ?? '');
        $body = (array) ($request->getParsedBody() ?? []);

        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'projects.manage')) {
            return JsonResponder::error($response, 'Access denied.', 'FORBIDDEN', 403);
        }

        try {
            $this->projects->addActivityLog($businessId, $branchId, $projectId, $userId, $body);
        } catch (Throwable $e) {
            return JsonResponder::error($response, $e->getMessage(), 'PROJECT_LOG_ERROR', 422);
        }

        if (($body['log_type'] ?? '') === 'revision') {
            $note = trim((string) ($body['title'] ?? ''));
            $this->notifier->notify($projectId, 'Project Revision Logged', "A revision was recorded: {$note}");
        }

        return JsonResponder::success($response, ['logged' => true], 201);
    }


    public function toggleDeliverable(Request $request, Response $response, array $args): Response {
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $businessId = (string) ($args['businessId'] ?? '');
        $projectId = (string) ($args['projectId'] ?? '');
        $logId = (string) ($args['logId'] ?? '');

        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'projects.manage')) {
            return JsonResponder::error($response, 'Access denied.', 'FORBIDDEN', 403);
        }

        $this->projects->toggleDeliverable($projectId, $logId);
        return JsonResponder::success($response, ['toggled' => true]);
    }


    public function billProject(Request $request, Response $response, array $args): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $businessId = (string) ($args['businessId'] ?? '');
        $branchId = (string) ($args['branchId'] ?? '');
        $projectId = (string) ($args['projectId'] ?? '');
        $body = (array) ($request->getParsedBody() ?? []);

        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'projects.manage')) {
            return JsonResponder::error($response, 'Access denied.', 'FORBIDDEN', 403);
        }

        $action = ($body['action'] ?? 'payment') === 'renew_retainer' ? 'renew_retainer' : 'payment';
        $amount = round((float) ($body['amount'] ?? 0), 2);
        $method = in_array($body['method'] ?? '', ['cash', 'transfer', 'credit'], true) ? $body['method'] : 'transfer';
        $label = trim((string) ($body['cycle_label'] ?? ''));

        try {
            $this->billing->recordPaymentOrRetainer($businessId, $branchId, $projectId, $userId, $action, $amount, $method, $label);
        } catch (Throwable $e) {
            return JsonResponder::error($response, $e->getMessage(), 'PROJECT_BILLING_ERROR', 422);
        }

        $this->audit->log($accountId, "creative.{$action}", $userId, $businessId, $branchId, 'creative_project', $projectId);
        $eventTitle = $action === 'renew_retainer' ? 'Monthly Retainer Invoice & Receipt' : 'Project Payment Receipt';
        $summary = $action === 'renew_retainer'
            ? "Your monthly retainer ({$label}) has been billed via " . strtoupper($method) . '.'
            : 'Payment of ₦' . number_format($amount, 2) . ' recorded via ' . strtoupper($method) . '.';
        $this->notifier->notify($projectId, $eventTitle, $summary);

        return JsonResponder::success($response, ['billed' => true], 201);
    }


    public function setDeliveryUrl(Request $request, Response $response, array $args): Response {
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $businessId = (string) ($args['businessId'] ?? '');
        $projectId = (string) ($args['projectId'] ?? '');
        $body = (array) ($request->getParsedBody() ?? []);
        $url = trim((string) ($body['delivery_url'] ?? ''));

        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'projects.manage')) {
            return JsonResponder::error($response, 'Access denied.', 'FORBIDDEN', 403);
        }

        try {
            $this->projects->updateDeliveryUrl($businessId, $projectId, $url);
        } catch (Throwable $e) {
            return JsonResponder::error($response, $e->getMessage(), 'DELIVERY_URL_ERROR', 422);
        }

        if ($url !== '') {
            $this->notifier->notify($projectId, 'Final Project Files Ready', 'Your final deliverables link has been uploaded. Open your project tracking link to access your files.');
        }

        return JsonResponder::success($response, ['saved' => true]);
    }
}
