<?php

declare(strict_types=1);

namespace App\Core\Creative;

use App\Core\Notifications\MailerService;
use PDO;

final class ProjectClientNotifier {
    public function __construct(private PDO $pdo, private MailerService $mailer) {}

    public function notify(string $projectId, string $eventTitle, string $summaryLine): void {
        $stmt = $this->pdo->prepare("
            SELECT p.title, p.public_token, p.stage, p.contract_amount, p.amount_paid,
                   p.revisions_included, p.revisions_used, p.due_date,
                   c.full_name AS client_name, c.email AS client_email,
                   b.name AS business_name, bb.app_name, bb.primary_color, bb.custom_domain
            FROM creative_projects p
            INNER JOIN businesses b ON b.id = p.business_id
            LEFT JOIN customers c ON c.id = p.customer_id
            LEFT JOIN business_branding bb ON bb.business_id = b.id
            WHERE p.id = :pid LIMIT 1
        ");
        $stmt->execute([':pid' => $projectId]);
        $row = $stmt->fetch();

        if (!$row || empty($row['client_email']) || empty($row['public_token'])) {
            return;
        }

        $brandName = (string) ($row['app_name'] ?: $row['business_name']);
        $color = (string) ($row['primary_color'] ?: '#0f4ef0');
        $baseUrl = !empty($row['custom_domain'])
            ? 'https://' . $row['custom_domain']
            : rtrim((string) ($_ENV['FRONTEND_URL'] ?? getenv('FRONTEND_URL') ?: 'http://localhost:5173'), '/');
        $trackUrl = "{$baseUrl}/track/{$row['public_token']}";

        $stageLabel = ucwords(str_replace('_', ' ', (string) $row['stage']));
        $quote = number_format((float) $row['contract_amount'], 2);
        $paid = number_format((float) $row['amount_paid'], 2);
        $balance = number_format(max(0.0, (float) $row['contract_amount'] - (float) $row['amount_paid']), 2);

        $html = "
            <div style='font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:14px;'>
                <p style='font-size:12px;font-weight:bold;color:{$color};text-transform:uppercase;margin:0 0 6px;'>" . htmlspecialchars($brandName) . "</p>
                <h2 style='color:#0f172a;margin:0 0 12px;font-size:18px;'>" . htmlspecialchars($eventTitle) . "</h2>
                <p style='color:#334155;font-size:14px;line-height:1.5;'>Hello <strong>" . htmlspecialchars((string) $row['client_name']) . "</strong>,</p>
                <p style='color:#334155;font-size:14px;line-height:1.5;'>" . htmlspecialchars($summaryLine) . "</p>
                <div style='background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin:16px 0;font-size:13px;color:#1e293b;'>
                    <p style='margin:4px 0;'><strong>Project:</strong> " . htmlspecialchars((string) $row['title']) . "</p>
                    <p style='margin:4px 0;'><strong>Current Stage:</strong> {$stageLabel}</p>
                    <p style='margin:4px 0;'><strong>Revisions:</strong> {$row['revisions_used']} of {$row['revisions_included']} included</p>
                    <p style='margin:4px 0;'><strong>Quote / Paid / Balance:</strong> ₦{$quote} / ₦{$paid} / ₦{$balance}</p>
                </div>
                <p style='text-align:center;margin:22px 0;'>
                    <a href='" . htmlspecialchars($trackUrl) . "' style='background:{$color};color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;font-size:14px;display:inline-block;'>View Live Project Progress</a>
                </p>
                <p style='color:#64748b;font-size:11px;text-align:center;'>Bookmark this link anytime to track deliverables, revisions, and payment status.</p>
            </div>
        ";

        $plain = "{$eventTitle} — {$summaryLine} | Project: {$row['title']} | Stage: {$stageLabel} | Paid: NGN {$paid} | Track live: {$trackUrl}";
        $this->mailer->sendTransactionalHtml((string) $row['client_email'], (string) $row['client_name'], $brandName, "{$eventTitle}: {$row['title']}", $html, $plain);
    }
}
