<?php

declare(strict_types=1);

namespace App\Core\Notifications;

use PHPMailer\PHPMailer\PHPMailer;
use RuntimeException;
use Throwable;

final class MailerService
{
    public function __construct(private string $appEnv) {}

    public function sendVerificationCode(string $toEmail, string $ownerName, string $otpCode): void {
        $driver = strtolower((string) ($_ENV['MAIL_DRIVER'] ?? ($this->appEnv === 'local' ? 'log' : 'smtp')));

        if ($driver === 'log') {
            $logLine = sprintf("[%s] TO: %s | OTP: %s\n", gmdate('Y-m-d H:i:s'), $toEmail, $otpCode);
            file_put_contents(__DIR__ . '/../../../storage/logs/mail.log', $logLine, FILE_APPEND);
            return;
        }

        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host       = (string) ($_ENV['MAIL_HOST'] ?? '');
            $mail->SMTPAuth   = true;
            $mail->Username   = (string) ($_ENV['MAIL_USERNAME'] ?? '');
            $mail->Password   = (string) ($_ENV['MAIL_PASSWORD'] ?? '');
            $mail->SMTPSecure = ($_ENV['MAIL_ENCRYPTION'] ?? 'tls') === 'ssl'
                ? PHPMailer::ENCRYPTION_SMTPS
                : PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = (int) ($_ENV['MAIL_PORT'] ?? 587);

            $fromAddress = (string) ($_ENV['MAIL_FROM_ADDRESS'] ?? 'noreply@businessos.app');
            $fromName    = (string) ($_ENV['MAIL_FROM_NAME'] ?? 'BusinessOS');

            $mail->setFrom($fromAddress, $fromName);
            $mail->addAddress($toEmail, $ownerName);
            $mail->isHTML(true);
            $mail->Subject = 'Your BusinessOS Verification Code';
            $mail->Body    = "
                <div style='font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;'>
                    <h2 style='color:#0f172a;margin-top:0;'>Verify your email</h2>
                    <p style='color:#475569;font-size:14px;'>Hello <strong>" . htmlspecialchars($ownerName) . "</strong>, use the 6-digit code below to verify your BusinessOS account:</p>
                    <div style='font-size:28px;font-weight:bold;letter-spacing:8px;color:#0f4ef0;background:#eff4ff;padding:14px;text-align:center;border-radius:8px;margin:20px 0;'>
                        {$otpCode}
                    </div>
                    <p style='color:#64748b;font-size:12px;'>This code expires in 15 minutes. If you did not create an account, please ignore this email.</p>
                </div>
            ";
            $mail->AltBody = "Hello {$ownerName}, your BusinessOS verification code is: {$otpCode}. Expires in 15 minutes.";

            $mail->send();
        } catch (Throwable $e) {
            error_log('[MailerService Error] ' . $e->getMessage());
            throw new RuntimeException('Unable to send verification email. Please check mail settings.');
        }
    }

    public function sendStaffInvite(string $toEmail, string $staffName, string $businessName, string $roleName, string $inviteUrl): void {
        $driver = strtolower((string) ($_ENV['MAIL_DRIVER'] ?? ($this->appEnv === 'local' ? 'log' : 'smtp')));

        if ($driver === 'log') {
            $logLine = sprintf("[%s] INVITE TO: %s (%s) | BIZ: %s | ROLE: %s | URL: %s\n", gmdate('Y-m-d H:i:s'), $toEmail, $staffName, $businessName, $roleName, $inviteUrl);
            file_put_contents(__DIR__ . '/../../../storage/logs/mail.log', $logLine, FILE_APPEND);
            return;
        }

        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host       = (string) ($_ENV['MAIL_HOST'] ?? '');
            $mail->SMTPAuth   = true;
            $mail->Username   = (string) ($_ENV['MAIL_USERNAME'] ?? '');
            $mail->Password   = (string) ($_ENV['MAIL_PASSWORD'] ?? '');
            $mail->SMTPSecure = ($_ENV['MAIL_ENCRYPTION'] ?? 'tls') === 'ssl'
                ? PHPMailer::ENCRYPTION_SMTPS
                : PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = (int) ($_ENV['MAIL_PORT'] ?? 587);

            $mail->setFrom((string) ($_ENV['MAIL_FROM_ADDRESS'] ?? 'noreply@businessos.app'), $businessName);
            $mail->addAddress($toEmail, $staffName);
            $mail->isHTML(true);
            $mail->Subject = "You're invited to join {$businessName}";
            $mail->Body    = "
                <div style='font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px;'>
                    <h2 style='color:#0f172a;margin-top:0;'>Welcome to " . htmlspecialchars($businessName) . "</h2>
                    <p style='color:#475569;font-size:14px;'>Hello <strong>" . htmlspecialchars($staffName) . "</strong>, you have been invited as <strong>" . htmlspecialchars($roleName) . "</strong>.</p>
                    <p style='margin:22px 0;text-align:center;'>
                        <a href='" . htmlspecialchars($inviteUrl) . "' style='background:#0f4ef0;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:bold;font-size:14px;display:inline-block;'>Set Password &amp; POS PIN</a>
                    </p>
                    <p style='color:#64748b;font-size:12px;'>This single-use link expires in 24 hours.</p>
                </div>
            ";
            $mail->AltBody = "Hello {$staffName}, you have been invited to {$businessName} as {$roleName}. Set up your password and PIN here: {$inviteUrl}";
            $mail->send();
        } catch (Throwable $e) {
            error_log('[MailerService Invite Error] ' . $e->getMessage());
        }
    }
}
