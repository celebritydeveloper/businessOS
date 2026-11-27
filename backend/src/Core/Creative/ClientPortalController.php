<?php

declare(strict_types=1);

namespace App\Core\Creative;

use App\Core\Http\JsonResponder;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class ClientPortalController
{
    public function __construct(private PDO $pdo) {}

    public function showByToken(Request $request, Response $response, array $args): Response
    {
        $token = trim((string) ($args['token'] ?? ''));
        if (strlen($token) < 32) {
            return JsonResponder::error($response, 'Invalid project tracking link.', 'NOT_FOUND', 404);
        }

        $stmt = $this->pdo->prepare("
            SELECT p.id, p.business_id, p.title, p.project_type, p.stage, p.contract_amount,
                   p.amount_billed, p.amount_paid, p.revisions_included, p.revisions_used,
                   p.due_date, p.billing_cycle_label, p.notes, p.updated_at,
                   c.full_name AS customer_name,
                   b.name AS business_name
            FROM creative_projects p
            INNER JOIN businesses b ON b.id = p.business_id
            LEFT JOIN customers c ON c.id = p.customer_id
            WHERE p.public_token = :tok AND b.is_active = 1
            LIMIT 1
        ");
        $stmt->execute([':tok' => $token]);
        $project = $stmt->fetch();

        if (!$project) {
            return JsonResponder::error($response, 'Project link not found or expired.', 'NOT_FOUND', 404);
        }

        // Safely load branding if available
        $bStmt = $this->pdo->prepare("SELECT * FROM business_branding WHERE business_id = :bid LIMIT 1");
        $bStmt->execute([':bid' => $project['business_id']]);
        $brand = $bStmt->fetch() ?: [];
        $project['app_name'] = $brand['app_name'] ?? $brand['brand_name'] ?? $project['business_name'];
        $project['logo_url'] = $brand['logo_url'] ?? null;
        $project['primary_color'] = $brand['primary_color'] ?? '#0f4ef0';

        $logStmt = $this->pdo->prepare("
            SELECT id, log_type, title, cost_amount, is_completed, created_at
            FROM creative_project_logs
            WHERE project_id = :pid
              AND log_type IN ('deliverable', 'revision', 'payment', 'retainer_renewal')
            ORDER BY created_at DESC
            LIMIT 50
        ");
        $logStmt->execute([':pid' => $project['id']]);
        $project['logs'] = $logStmt->fetchAll();

        return JsonResponder::success($response, ['project' => $project]);
    }
}
