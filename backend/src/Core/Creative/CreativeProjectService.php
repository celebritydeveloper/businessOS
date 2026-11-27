<?php

declare(strict_types=1);

namespace App\Core\Creative;

use App\Core\Http\JsonResponder;
use PDO;
use Ramsey\Uuid\Uuid;
use RuntimeException;
use Throwable;

final class CreativeProjectService {
    public function __construct(private PDO $pdo) {}

    public function listProjects(string $accountId, string $businessId, string $branchId): array  {
        $stmt = $this->pdo->prepare("
            SELECT p.*, c.full_name AS customer_name, c.phone AS customer_phone
            FROM creative_projects p
            INNER JOIN businesses b ON b.id = p.business_id
            LEFT JOIN customers c ON c.id = p.customer_id
            WHERE p.business_id = :bid AND p.branch_id = :brid AND b.account_id = :aid
            ORDER BY FIELD(p.stage, 'in_progress', 'revisions', 'client_review', 'brief', 'delivered'), p.created_at DESC
            LIMIT 100
        ");
        $stmt->execute([':bid' => $businessId, ':brid' => $branchId, ':aid' => $accountId]);
        $projects = $stmt->fetchAll();

        $logStmt = $this->pdo->prepare("SELECT * FROM creative_project_logs WHERE project_id = :pid ORDER BY created_at DESC LIMIT 40");
        foreach ($projects as &$proj) {
            $logStmt->execute([':pid' => $proj['id']]);
            $proj['logs'] = $logStmt->fetchAll();
        }
        unset($proj);
        return $projects;
    }

    public function createProject(string $businessId, string $branchId, string $userId, array $d): string {
        $id = Uuid::uuid4()->toString();
        $token = bin2hex(random_bytes(32));
        $type = ($d['project_type'] ?? 'fixed_project') === 'monthly_retainer' ? 'monthly_retainer' : 'fixed_project';

        $this->pdo->prepare("
            INSERT INTO creative_projects
            (id, business_id, branch_id, customer_id, title, project_type, contract_amount, revisions_included, due_date, billing_cycle_label, notes, public_token, created_by_user_id)
            VALUES (:id, :bid, :brid, :cid, :title, :ptype, :amt, :rev, :due, :cycle, :notes, :token, :uid)
        ")->execute([
            ':id'    => $id,
            ':bid'   => $businessId,
            ':brid'  => $branchId,
            ':cid'   => ($d['customer_id'] ?? '') !== '' ? $d['customer_id'] : null,
            ':title' => $d['title'],
            ':ptype' => $type,
            ':amt'   => round((float) ($d['contract_amount'] ?? 0), 2),
            ':rev'   => max(0, (int) ($d['revisions_included'] ?? 3)),
            ':due'   => ($d['due_date'] ?? '') !== '' ? $d['due_date'] : null,
            ':cycle' => $type === 'monthly_retainer' ? gmdate('M Y') : null,
            ':notes' => ($d['notes'] ?? '') !== '' ? $d['notes'] : null,
            ':token' => $token,
            ':uid'   => $userId,
        ]);

        return $id;
    }


    public function updateStage(string $businessId, string $projectId, string $stage): void {
        $allowed = ['brief', 'in_progress', 'client_review', 'revisions', 'delivered'];
        if (!in_array($stage, $allowed, true)) {
            throw new RuntimeException('Invalid project stage.');
        }
        $this->pdo->prepare("UPDATE creative_projects SET stage = :st WHERE id = :pid AND business_id = :bid")
            ->execute([':st' => $stage, ':pid' => $projectId, ':bid' => $businessId]);
    }

    public function addActivityLog(string $businessId, string $branchId, string $projectId, string $userId, array $d): void {
        $type = (string) ($d['log_type'] ?? 'deliverable');
        $title = trim((string) ($d['title'] ?? ''));
        $hours = max(0.0, round((float) ($d['hours_spent'] ?? 0), 2));
        $cost = max(0.0, round((float) ($d['cost_amount'] ?? 0), 2));

        if ($title === '') {
            throw new RuntimeException('Activity description is required.');
        }

        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare("SELECT id, title FROM creative_projects WHERE id = :pid AND business_id = :bid FOR UPDATE");
            $stmt->execute([':pid' => $projectId, ':bid' => $businessId]);
            $proj = $stmt->fetch();
            if (!$proj) throw new RuntimeException('Project not found.');

            $logId = Uuid::uuid4()->toString();
            $this->pdo->prepare("
                INSERT INTO creative_project_logs (id, project_id, log_type, title, hours_spent, cost_amount, actor_user_id)
                VALUES (:id, :pid, :ltype, :title, :hrs, :cost, :uid)
            ")->execute([':id' => $logId, ':pid' => $projectId, ':ltype' => $type, ':title' => $title, ':hrs' => $hours, ':cost' => $cost, ':uid' => $userId]);

            if ($type === 'time_log' && $hours > 0) {
                $this->pdo->prepare("UPDATE creative_projects SET total_hours_logged = total_hours_logged + :h WHERE id = :pid")
                    ->execute([':h' => $hours, ':pid' => $projectId]);
            } elseif ($type === 'revision') {
                $this->pdo->prepare("UPDATE creative_projects SET revisions_used = revisions_used + 1, stage = 'revisions' WHERE id = :pid")
                    ->execute([':pid' => $projectId]);
            } elseif ($type === 'expense' && $cost > 0) {
                $this->pdo->prepare("UPDATE creative_projects SET direct_cost = direct_cost + :c WHERE id = :pid")
                    ->execute([':c' => $cost, ':pid' => $projectId]);
                $this->postDirectExpenseJournal($businessId, $branchId, $logId, "Project Cost ({$proj['title']}): {$title}", $cost);
            }

            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function toggleDeliverable(string $projectId, string $logId): void {
        $this->pdo->prepare("UPDATE creative_project_logs SET is_completed = 1 - is_completed WHERE id = :lid AND project_id = :pid AND log_type = 'deliverable'")
            ->execute([':lid' => $logId, ':pid' => $projectId]);
    }


    public function updateDeliveryUrl(string $businessId, string $projectId, string $deliveryUrl): void {
        if ($deliveryUrl !== '' && !filter_var($deliveryUrl, FILTER_VALIDATE_URL)) {
            throw new RuntimeException('Please enter a valid URL (e.g., https://google.com...).');
        }
        $this->pdo->prepare("UPDATE creative_projects SET delivery_url = :url WHERE id = :pid AND business_id = :bid")
            ->execute([':url' => $deliveryUrl !== '' ? $deliveryUrl : null, ':pid' => $projectId, ':bid' => $businessId]);
    }


    private function postDirectExpenseJournal(string $businessId, string $branchId, string $refId, string $memo, float $amount): void {
        $entryId = Uuid::uuid4()->toString();
        $this->pdo->prepare("INSERT INTO journal_entries (id, business_id, branch_id, reference_type, reference_id, memo, posted_at) VALUES (:id, :bid, :brid, 'project_expense', :rid, :memo, :at)")
            ->execute([':id' => $entryId, ':bid' => $businessId, ':brid' => $branchId, ':rid' => $refId, ':memo' => substr($memo, 0, 250), ':at' => gmdate('Y-m-d H:i:s')]);
        $line = $this->pdo->prepare("INSERT INTO journal_lines (id, journal_entry_id, account_code, debit, credit) VALUES (:id, :eid, :code, :dr, :cr)");
        $line->execute([':id' => Uuid::uuid4()->toString(), ':eid' => $entryId, ':code' => '5000', ':dr' => $amount, ':cr' => 0.0]);
        $line->execute([':id' => Uuid::uuid4()->toString(), ':eid' => $entryId, ':code' => '1010', ':dr' => 0.0, ':cr' => $amount]);
    }

}
