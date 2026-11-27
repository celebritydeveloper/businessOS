<?php

declare(strict_types=1);

namespace App\Core\Creative;

use PDO;
use Ramsey\Uuid\Uuid;
use RuntimeException;
use Throwable;

final class CreativeBillingService
{
    public function __construct(private PDO $pdo) {}

    public function recordPaymentOrRetainer(
        string $businessId,
        string $branchId,
        string $projectId,
        string $userId,
        string $action,
        float $amount,
        string $method,
        string $cycleLabel
    ): void {
        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare("SELECT * FROM creative_projects WHERE id = :pid AND business_id = :bid FOR UPDATE");
            $stmt->execute([':pid' => $projectId, ':bid' => $businessId]);
            $proj = $stmt->fetch();
            if (!$proj) throw new RuntimeException('Project not found.');

            $billAmt = $action === 'renew_retainer' ? (float) $proj['contract_amount'] : $amount;
            if ($billAmt <= 0) throw new RuntimeException('Billing amount must be greater than zero.');

            if ($method === 'credit' && empty($proj['customer_id'])) {
                throw new RuntimeException('Link a registered customer to this project before billing on Credit.');
            }

            $logId = Uuid::uuid4()->toString();
            if ($action === 'renew_retainer') {
                $label = $cycleLabel !== '' ? $cycleLabel : gmdate('M Y');
                $this->pdo->prepare("
                    UPDATE creative_projects
                    SET billing_cycle_label = :lbl,
                        amount_billed = amount_billed + :amt,
                        amount_paid = amount_paid + :paid,
                        stage = 'in_progress'
                    WHERE id = :pid
                ")->execute([
                    ':lbl'  => $label,
                    ':amt'  => $billAmt,
                    ':paid' => $method === 'credit' ? 0.0 : $billAmt,
                    ':pid'  => $projectId,
                ]);

                // Reset deliverable checkboxes for the new retainer month
                $this->pdo->prepare("UPDATE creative_project_logs SET is_completed = 0 WHERE project_id = :pid AND log_type = 'deliverable'")
                    ->execute([':pid' => $projectId]);

                $logTitle = "Monthly Retainer Billed ({$label}) — " . strtoupper($method);
                $logType = 'retainer_renewal';
            } else {
                $this->pdo->prepare("
                    UPDATE creative_projects
                    SET amount_billed = GREATEST(amount_billed, amount_paid + :amt1),
                        amount_paid = amount_paid + :paid
                    WHERE id = :pid
                ")->execute([
                    ':amt1' => $billAmt,
                    ':paid' => $method === 'credit' ? 0.0 : $billAmt,
                    ':pid'  => $projectId,
                ]);

                $logTitle = $cycleLabel !== '' ? $cycleLabel : ('Milestone Payment (' . strtoupper($method) . ')');
                $logType = 'payment';
            }

            $this->pdo->prepare("
                INSERT INTO creative_project_logs (id, project_id, log_type, title, cost_amount, actor_user_id)
                VALUES (:id, :pid, :ltype, :title, :amt, :uid)
            ")->execute([':id' => $logId, ':pid' => $projectId, ':ltype' => $logType, ':title' => $logTitle, ':amt' => $billAmt, ':uid' => $userId]);

            if (!empty($proj['customer_id'])) {
                $this->pdo->prepare("UPDATE customers SET total_spent = total_spent + :s, credit_balance = credit_balance + :c WHERE id = :cid")
                    ->execute([':s' => $billAmt, ':c' => $method === 'credit' ? $billAmt : 0.0, ':cid' => $proj['customer_id']]);
            }

            $debitCode = match ($method) {
                'cash'   => '1000',
                'credit' => '1100',
                default  => '1010',
            };
            $this->postRevenueJournal($businessId, $branchId, $logId, "Creative Studio ({$proj['title']}): {$logTitle}", $debitCode, $billAmt);

            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    private function postRevenueJournal(string $businessId, string $branchId, string $refId, string $memo, string $debitCode, float $amount): void
    {
        $entryId = Uuid::uuid4()->toString();
        $this->pdo->prepare("INSERT INTO journal_entries (id, business_id, branch_id, reference_type, reference_id, memo, posted_at) VALUES (:id, :bid, :brid, 'creative_invoice', :rid, :memo, :at)")
            ->execute([':id' => $entryId, ':bid' => $businessId, ':brid' => $branchId, ':rid' => $refId, ':memo' => substr($memo, 0, 250), ':at' => gmdate('Y-m-d H:i:s')]);
        $line = $this->pdo->prepare("INSERT INTO journal_lines (id, journal_entry_id, account_code, debit, credit) VALUES (:id, :eid, :code, :dr, :cr)");
        $line->execute([':id' => Uuid::uuid4()->toString(), ':eid' => $entryId, ':code' => $debitCode, ':dr' => $amount, ':cr' => 0.0]);
        $line->execute([':id' => Uuid::uuid4()->toString(), ':eid' => $entryId, ':code' => '4000', ':dr' => 0.0, ':cr' => $amount]);
    }
}
