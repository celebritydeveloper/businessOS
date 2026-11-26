<?php

declare(strict_types=1);

namespace App\Core\Accounting;

use App\Core\Http\JsonResponder;
use App\Core\Security\AuditLogger;
use App\Core\Security\PermissionService;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class AccountingController {
    public function __construct(
        private PDO $pdo,
        private AuditLogger $audit,
        private PermissionService $perms
    ) {}

    public function getReports(Request $request, Response $response, array $args): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $businessId = (string) ($args['businessId'] ?? '');

        $bizCheck = $this->pdo->prepare("SELECT id FROM businesses WHERE id = :bid AND account_id = :aid AND is_active = 1 LIMIT 1");
        $bizCheck->execute([':bid' => $businessId, ':aid' => $accountId]);
        if (!$bizCheck->fetch()) {
            return JsonResponder::error($response, 'Business not found.', 'NOT_FOUND', 404);
        }

        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'accounting.view')) {
            return JsonResponder::error($response, 'You do not have permission to view accounting reports.', 'FORBIDDEN', 403);
        }

        $query = $request->getQueryParams();
        $branchId = trim((string) ($query['branch_id'] ?? ''));
        $dateFrom = trim((string) ($query['date_from'] ?? gmdate('Y-m-01')));
        $dateTo = trim((string) ($query['date_to'] ?? gmdate('Y-m-d')));

        $branchSql = $branchId !== '' ? ' AND je.branch_id = :brid ' : '';
        $params = [
            ':bid'   => $businessId,
            ':dfrom' => "{$dateFrom} 00:00:00",
            ':dto'   => "{$dateTo} 23:59:59",
        ];
        if ($branchId !== '') {
            $params[':brid'] = $branchId;
        }

        // 1. Trial Balance & Account Totals
        $tbStmt = $this->pdo->prepare("
            SELECT coa.code, coa.name, coa.description, coa.account_type,
                COALESCE(SUM(CASE WHEN je.id IS NOT NULL THEN jl.debit ELSE 0 END), 0) AS total_debit,
                COALESCE(SUM(CASE WHEN je.id IS NOT NULL THEN jl.credit ELSE 0 END), 0) AS total_credit
            FROM chart_of_accounts coa
            LEFT JOIN journal_lines jl ON jl.account_code = coa.code
            LEFT JOIN journal_entries je ON je.id = jl.journal_entry_id
                AND je.business_id = :bid
                AND je.posted_at BETWEEN :dfrom AND :dto
                {$branchSql}
            WHERE coa.business_id = :bid2
            GROUP BY coa.code, coa.name, coa.description, coa.account_type
            ORDER BY coa.code ASC
        ");

        $tbStmt->execute(array_merge($params, [':bid2' => $businessId]));
        $accounts = $tbStmt->fetchAll();

        $revenue = 0.0;
        $cogs = 0.0;
        $expenses = 0.0;
        $totalDebits = 0.0;
        $totalCredits = 0.0;

        foreach ($accounts as &$acc) {
            $dr = (float) $acc['total_debit'];
            $cr = (float) $acc['total_credit'];
            $acc['total_debit'] = $dr;
            $acc['total_credit'] = $cr;
            $totalDebits += $dr;
            $totalCredits += $cr;

            if ($acc['account_type'] === 'revenue') {
                $revenue += ($cr - $dr);
            } elseif ($acc['code'] === '5000') {
                $cogs += ($dr - $cr);
            } elseif ($acc['account_type'] === 'expense') {
                $expenses += ($dr - $cr);
            }
        }
        unset($acc);

        $grossProfit = round($revenue - $cogs, 2);
        $netProfit = round($grossProfit - $expenses, 2);

        // 2. General Ledger Journal Entries (Last 100 in range)
        $jeStmt = $this->pdo->prepare("
            SELECT je.id, je.reference_type, je.memo, je.posted_at, br.name AS branch_name
            FROM journal_entries je
            LEFT JOIN branches br ON br.id = je.branch_id
            WHERE je.business_id = :bid
              AND je.posted_at BETWEEN :dfrom AND :dto
              {$branchSql}
            ORDER BY je.posted_at DESC
            LIMIT 100
        ");
        $jeStmt->execute($params);
        $entries = $jeStmt->fetchAll();

        if (!empty($entries)) {
            $entryIds = array_column($entries, 'id');
            $placeholders = implode(',', array_fill(0, count($entryIds), '?'));
            $lineStmt = $this->pdo->prepare("
                SELECT jl.journal_entry_id, jl.account_code, jl.debit, jl.credit, coa.name AS account_name
                FROM journal_lines jl
                LEFT JOIN chart_of_accounts coa ON coa.code = jl.account_code AND coa.business_id = ?
                WHERE jl.journal_entry_id IN ({$placeholders})
                ORDER BY jl.debit DESC, jl.credit DESC
            ");
            $lineStmt->execute(array_merge([$businessId], $entryIds));
            $linesByEntry = [];
            foreach ($lineStmt->fetchAll() as $l) {
                $linesByEntry[$l['journal_entry_id']][] = $l;
            }
            foreach ($entries as &$entry) {
                $entry['lines'] = $linesByEntry[$entry['id']] ?? [];
            }
            unset($entry);
        }

        return JsonResponder::success($response, [
            'period' => ['date_from' => $dateFrom, 'date_to' => $dateTo],
            'pnl' => [
                'revenue'      => round($revenue, 2),
                'cogs'         => round($cogs, 2),
                'gross_profit' => $grossProfit,
                'expenses'     => round($expenses, 2),
                'net_profit'   => $netProfit,
            ],
            'trial_balance' => [
                'accounts'      => $accounts,
                'total_debits'  => round($totalDebits, 2),
                'total_credits' => round($totalCredits, 2),
            ],
            'journal_entries' => $entries,
        ]);
    }


    public function recordExpense(Request $request, Response $response, array $args): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $businessId = (string) ($args['businessId'] ?? '');
        $body = (array) ($request->getParsedBody() ?? []);

        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'accounting.view')) {
            return JsonResponder::error($response, 'You do not have permission to record expenses.', 'FORBIDDEN', 403);
        }

        $branchId = trim((string) ($body['branch_id'] ?? ''));
        $expenseCode = trim((string) ($body['expense_account_code'] ?? ''));
        $paymentCode = ($body['payment_account_code'] ?? '1000') === '1010' ? '1010' : '1000';
        $amount = round((float) ($body['amount'] ?? 0), 2);
        $vendorName = trim((string) ($body['vendor_name'] ?? ''));
        $description = trim((string) ($body['description'] ?? ''));
        $expenseDate = trim((string) ($body['expense_date'] ?? gmdate('Y-m-d')));

        if ($branchId === '' || $expenseCode === '' || $amount <= 0 || $description === '') {
            return JsonResponder::error($response, 'Branch, expense category, positive amount, and description are required.', 'VALIDATION_ERROR', 422);
        }

        $coaStmt = $this->pdo->prepare("SELECT code, name FROM chart_of_accounts WHERE business_id = :bid AND code = :code AND account_type = 'expense' LIMIT 1");
        $coaStmt->execute([':bid' => $businessId, ':code' => $expenseCode]);
        $expenseAcc = $coaStmt->fetch();
        if (!$expenseAcc) {
            return JsonResponder::error($response, 'Invalid expense ledger account.', 'INVALID_ACCOUNT', 422);
        }

        $expenseId = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $entryId = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $postedAt = "{$expenseDate} " . gmdate('H:i:s');
        $vendorPrefix = $vendorName !== '' ? " [{$vendorName}]" : '';
        $memo = "Expense ({$expenseAcc['name']}){$vendorPrefix}: {$description}";

        $this->pdo->beginTransaction();
        try {
            $this->pdo->prepare("
                INSERT INTO expenses
                (id, business_id, branch_id, expense_account_code, payment_account_code, vendor_name, description, amount, expense_date, recorded_by_user_id)
                VALUES
                (:id, :bid, :brid, :ecode, :pcode, :vendor, :desc, :amt, :edate, :uid)
            ")->execute([
                ':id'     => $expenseId,
                ':bid'    => $businessId,
                ':brid'   => $branchId,
                ':ecode'  => $expenseCode,
                ':pcode'  => $paymentCode,
                ':vendor' => $vendorName !== '' ? substr($vendorName, 0, 150) : null,
                ':desc'   => substr($description, 0, 255),
                ':amt'    => $amount,
                ':edate'  => $expenseDate,
                ':uid'    => $userId,
            ]);

            $this->pdo->prepare("
                INSERT INTO journal_entries (id, business_id, branch_id, reference_type, reference_id, memo, posted_at)
                VALUES (:id, :bid, :brid, 'expense', :rid, :memo, :at)
            ")->execute([
                ':id'   => $entryId,
                ':bid'  => $businessId,
                ':brid' => $branchId,
                ':rid'  => $expenseId,
                ':memo' => substr($memo, 0, 250),
                ':at'   => $postedAt,
            ]);

            $lineStmt = $this->pdo->prepare("INSERT INTO journal_lines (id, journal_entry_id, account_code, debit, credit) VALUES (:id, :eid, :code, :dr, :cr)");
            $lineStmt->execute([':id' => \Ramsey\Uuid\Uuid::uuid4()->toString(), ':eid' => $entryId, ':code' => $expenseCode, ':dr' => $amount, ':cr' => 0.0]);
            $lineStmt->execute([':id' => \Ramsey\Uuid\Uuid::uuid4()->toString(), ':eid' => $entryId, ':code' => $paymentCode, ':dr' => 0.0, ':cr' => $amount]);

            $this->pdo->commit();
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            return JsonResponder::error($response, $e->getMessage(), 'EXPENSE_ERROR', 422);
        }

        $this->audit->log($accountId, 'accounting.expense_recorded', $userId, $businessId, $branchId, 'expense', $expenseId, null, ['amount' => $amount, 'account' => $expenseCode]);
        return JsonResponder::success($response, ['expense_id' => $expenseId, 'journal_entry_id' => $entryId], 201);
    }
}
