<?php

declare(strict_types=1);

namespace App\Core\Agriculture;

use App\Core\Http\JsonResponder;
use App\Core\Security\AuditLogger;
use App\Core\Security\PermissionService;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Throwable;

final class AgricultureController
{
    public function __construct(
        private FarmCycleService $service,
        private FarmInputService $inputs,
        private AuditLogger $audit,
        private PermissionService $perms
    ) {}

    public function listInputs(Request $request, Response $response, array $args): Response
    {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $businessId = (string) ($args['businessId'] ?? '');
        $branchId = (string) ($args['branchId'] ?? '');

        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'farm.manage')) {
            return JsonResponder::error($response, 'You do not have permission to view farm inputs.', 'FORBIDDEN', 403);
        }

        return JsonResponder::success($response, [
            'inputs' => $this->inputs->listInputs($accountId, $businessId, $branchId),
        ]);
    }

    public function saveInput(Request $request, Response $response, array $args): Response
    {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $businessId = (string) ($args['businessId'] ?? '');
        $branchId = (string) ($args['branchId'] ?? '');
        $body = (array) ($request->getParsedBody() ?? []);

        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'farm.manage')) {
            return JsonResponder::error($response, 'You do not have permission to manage farm inputs.', 'FORBIDDEN', 403);
        }

        $inputId = trim((string) ($body['input_id'] ?? ''));
        $name = trim((string) ($body['name'] ?? ''));
        $qty = (float) ($body['quantity'] ?? 0);

        if ($qty <= 0 || ($inputId === '' && $name === '')) {
            return JsonResponder::error($response, 'Provide a positive quantity and input name.', 'VALIDATION_ERROR', 422);
        }

        $allowedCats = ['feed', 'seed', 'fertilizer', 'vaccine_drug', 'other'];
        $cat = in_array($body['category'] ?? '', $allowedCats, true) ? (string) $body['category'] : 'feed';

        try {
            $savedId = $this->inputs->createOrRestockInput($businessId, $branchId, [
                'input_id'      => $inputId,
                'name'          => $name,
                'category'      => $cat,
                'unit_label'    => trim((string) ($body['unit_label'] ?? 'Bags')) ?: 'Bags',
                'quantity'      => $qty,
                'reorder_level' => (float) ($body['reorder_level'] ?? 5),
                'unit_cost'     => (float) ($body['unit_cost'] ?? 0),
            ]);
        } catch (Throwable $e) {
            return JsonResponder::error($response, $e->getMessage(), 'FARM_INPUT_ERROR', 422);
        }

        $this->audit->log($accountId, 'farm.input_stocked', $userId, $businessId, $branchId, 'farm_input', $savedId);
        return JsonResponder::success($response, ['input_id' => $savedId], 201);
    }

    public function listCycles(Request $request, Response $response, array $args): Response
    {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $businessId = (string) ($args['businessId'] ?? '');
        $branchId = (string) ($args['branchId'] ?? '');

        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'farm.manage')) {
            return JsonResponder::error($response, 'You do not have permission to view farm cycles.', 'FORBIDDEN', 403);
        }

        return JsonResponder::success($response, [
            'cycles' => $this->service->listCyclesWithLogs($accountId, $businessId, $branchId),
        ]);
    }

    public function createCycle(Request $request, Response $response, array $args): Response
    {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $businessId = (string) ($args['businessId'] ?? '');
        $branchId = (string) ($args['branchId'] ?? '');
        $body = (array) ($request->getParsedBody() ?? []);

        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'farm.manage')) {
            return JsonResponder::error($response, 'You do not have permission to create farm cycles.', 'FORBIDDEN', 403);
        }

        $cycleType = ($body['cycle_type'] ?? 'livestock') === 'crop' ? 'crop' : 'livestock';
        $payload = [
            'cycle_type'            => $cycleType,
            'name'                  => trim((string) ($body['name'] ?? '')),
            'species_or_crop'       => trim((string) ($body['species_or_crop'] ?? '')),
            'initial_quantity'      => (float) ($body['initial_quantity'] ?? 0),
            'unit_label'            => trim((string) ($body['unit_label'] ?? ($cycleType === 'crop' ? 'Plots' : 'Birds'))) ?: 'Birds',
            'initial_cost'          => round((float) ($body['initial_cost'] ?? 0), 2),
            'start_date'            => trim((string) ($body['start_date'] ?? gmdate('Y-m-d'))),
            'expected_harvest_date' => trim((string) ($body['expected_harvest_date'] ?? '')),
            'notes'                 => trim((string) ($body['notes'] ?? '')),
        ];

        if ($payload['name'] === '' || $payload['species_or_crop'] === '' || $payload['initial_quantity'] <= 0 || $payload['expected_harvest_date'] === '') {
            return JsonResponder::error($response, 'Cycle name, species/crop, initial quantity, and expected harvest date are required.', 'VALIDATION_ERROR', 422);
        }

        try {
            $cycleId = $this->service->createCycle($businessId, $branchId, $userId, $payload);
        } catch (Throwable $e) {
            return JsonResponder::error($response, $e->getMessage(), 'CYCLE_CREATE_ERROR', 422);
        }

        $this->audit->log($accountId, 'farm.cycle_created', $userId, $businessId, $branchId, 'farm_cycle', $cycleId);
        return JsonResponder::success($response, ['cycle_id' => $cycleId], 201);
    }

    public function recordCycleLog(Request $request, Response $response, array $args): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $businessId = (string) ($args['businessId'] ?? '');
        $branchId = (string) ($args['branchId'] ?? '');
        $cycleId = (string) ($args['cycleId'] ?? '');
        $body = (array) ($request->getParsedBody() ?? []);

        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'farm.manage')) {
            return JsonResponder::error($response, 'You do not have permission to update farm cycles.', 'FORBIDDEN', 403);
        }

        $allowedTypes = ['milestone', 'feed_input', 'mortality', 'vaccination', 'partial_harvest', 'harvest'];
        $logType = (string) ($body['log_type'] ?? 'milestone');
        if (!in_array($logType, $allowedTypes, true)) {
            return JsonResponder::error($response, 'Invalid log type.', 'VALIDATION_ERROR', 422);
        }

        try {
            $this->service->recordLog($businessId, $branchId, $cycleId, $userId, [
                'log_type'           => $logType,
                'title'              => trim((string) ($body['title'] ?? '')),
                'catalog_item_id'    => trim((string) ($body['catalog_item_id'] ?? '')),
                'farm_input_id'      => trim((string) ($body['farm_input_id'] ?? '')),
                'create_new_product' => !empty($body['create_new_product']),
                'new_product_name'   => trim((string) ($body['new_product_name'] ?? '')),
                'new_product_unit'   => trim((string) ($body['new_product_unit'] ?? 'Crate')),
                'new_product_price'  => (float) ($body['new_product_price'] ?? 0),
                'shelf_life_days'    => (int) ($body['shelf_life_days'] ?? 30),
                'quantity'           => (float) ($body['quantity'] ?? 0),
                'cost_amount'        => round((float) ($body['cost_amount'] ?? 0), 2),
                'log_date'           => trim((string) ($body['log_date'] ?? gmdate('Y-m-d'))),
                'notes'              => trim((string) ($body['notes'] ?? '')),
            ]);
        } catch (Throwable $e) {
            return JsonResponder::error($response, $e->getMessage(), 'CYCLE_LOG_ERROR', 422);
        }

        $this->audit->log($accountId, "farm.cycle_{$logType}", $userId, $businessId, $branchId, 'farm_cycle', $cycleId);
        return JsonResponder::success($response, ['logged' => true], 201);
    }
}
