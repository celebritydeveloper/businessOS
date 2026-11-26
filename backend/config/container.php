<?php

declare(strict_types=1);

use App\Core\Accounting\AccountingController;
use App\Core\Auth\AuthController;
use App\Core\Auth\SessionAuthService;
use App\Core\Billing\BillingController;
use App\Core\Billing\Gateways\FlutterwaveGateway;
use App\Core\Billing\Gateways\PaystackGateway;
use App\Core\Inventory\CatalogController;
use App\Core\Inventory\InventoryLedgerService;
use App\Core\Inventory\StockTransferController;
use App\Core\Middleware\JwtAuthMiddleware;
use App\Core\Middleware\SubscriptionGuardMiddleware;
use App\Core\Notifications\MailerService;
use App\Core\Pos\PosController;
use App\Core\Security\AuditLogController;
use App\Core\Security\AuditLogger;
use App\Core\Security\CryptoService;
use App\Core\Security\PermissionService;
use App\Core\Security\RateLimiter;
use App\Core\Tenancy\BrandingController;
use App\Core\Tenancy\DashboardController;
use App\Core\Tenancy\DefaultBusinessSeeder;
use App\Core\Tenancy\OnboardingController;
use App\Core\Tenancy\PlanQuotaService;
use App\Core\Tenancy\StaffController;
use DI\Container;

return static function (): Container {
    $container = new Container();

    $container->set(PDO::class, require __DIR__ . '/database.php');

    $container->set(CryptoService::class, static fn(): CryptoService => new CryptoService(
        (string) ($_ENV['ENCRYPTION_KEY'] ?? $_SERVER['ENCRYPTION_KEY'] ?? 'local_dev_fallback_enc_key_123456')
    ));


    $container->set(RateLimiter::class, static fn(Container $c): RateLimiter => new RateLimiter($c->get(PDO::class)));
    $container->set(AuditLogger::class, static fn(Container $c): AuditLogger => new AuditLogger($c->get(PDO::class)));
    $container->set(MailerService::class, static fn(): MailerService => new MailerService((string) ($_ENV['APP_ENV'] ?? 'local')));
    $container->set(PlanQuotaService::class, static fn(Container $c): PlanQuotaService => new PlanQuotaService($c->get(PDO::class)));

    $container->set(SessionAuthService::class, static fn(Container $c): SessionAuthService => new SessionAuthService(
        $c->get(PDO::class),
        $c->get(CryptoService::class),
        (string) ($_ENV['JWT_SECRET'] ?? $_SERVER['JWT_SECRET'] ?? 'local_dev_fallback_secret_key_change_me_1234567890')
    ));


    $container->set(PaystackGateway::class, static fn(): PaystackGateway => new PaystackGateway(
        (string) ($_ENV['PAYSTACK_SECRET_KEY'] ?? '')
    ));

    $container->set(FlutterwaveGateway::class, static fn(): FlutterwaveGateway => new FlutterwaveGateway(
        (string) ($_ENV['FLUTTERWAVE_SECRET_KEY'] ?? ''),
        //(string) ($_ENV['FLUTTERWAVE_WEBHOOK_HASH'] ?? '')
    ));

    $container->set(JwtAuthMiddleware::class, static fn(Container $c): JwtAuthMiddleware => new JwtAuthMiddleware($c->get(SessionAuthService::class)));
    $container->set(SubscriptionGuardMiddleware::class, static fn(Container $c): SubscriptionGuardMiddleware => new SubscriptionGuardMiddleware($c->get(PDO::class)));

    $container->set(AuthController::class, static fn(Container $c): AuthController => new AuthController(
        $c->get(PDO::class),
        $c->get(CryptoService::class),
        $c->get(SessionAuthService::class),
        $c->get(RateLimiter::class),
        $c->get(AuditLogger::class),
        $c->get(MailerService::class)
    ));


    $container->set(OnboardingController::class, static fn(Container $c): OnboardingController => new OnboardingController(
        $c->get(PDO::class),
        $c->get(CryptoService::class),
        $c->get(AuditLogger::class),
        $c->get(DefaultBusinessSeeder::class),
        $c->get(PlanQuotaService::class)
    ));

    $container->set(BillingController::class, static fn(Container $c): BillingController => new BillingController(
        $c->get(PDO::class),
        $c->get(PaystackGateway::class),
        $c->get(FlutterwaveGateway::class),
        $c->get(AuditLogger::class)
    ));

    $container->set(BrandingController::class, static fn(Container $c): BrandingController => new BrandingController(
        $c->get(PDO::class),
        $c->get(PlanQuotaService::class),
        $c->get(AuditLogger::class)
    ));

    $container->set(InventoryLedgerService::class, static fn(Container $c): InventoryLedgerService => new InventoryLedgerService(
        $c->get(PDO::class)
    ));

    $container->set(PermissionService::class, static fn(Container $c): PermissionService => new PermissionService(
        $c->get(PDO::class)
    ));

    $container->set(CatalogController::class, static fn(Container $c): CatalogController => new CatalogController(
        $c->get(PDO::class),
        $c->get(InventoryLedgerService::class),
        $c->get(PlanQuotaService::class),
        $c->get(AuditLogger::class),
        $c->get(PermissionService::class)
    ));

    $container->set(StockTransferController::class, static fn(Container $c): StockTransferController => new StockTransferController(
        $c->get(PDO::class),
        $c->get(InventoryLedgerService::class),
        $c->get(AuditLogger::class),
        $c->get(PermissionService::class)
    ));

    $container->set(PosController::class, static fn(Container $c): PosController => new PosController(
        $c->get(PDO::class),
        $c->get(InventoryLedgerService::class),
        $c->get(AuditLogger::class),
        $c->get(PermissionService::class)
    ));

    $container->set(StaffController::class, static fn(Container $c): StaffController => new StaffController(
        $c->get(PDO::class),
        $c->get(PlanQuotaService::class),
        $c->get(AuditLogger::class),
        $c->get(MailerService::class),
        $c->get(PermissionService::class)
    ));

    $container->set(AuditLogController::class, static fn(Container $c): AuditLogController => new AuditLogController(
        $c->get(PDO::class),
        $c->get(PermissionService::class)
    ));

    $container->set(AccountingController::class, static fn(Container $c): AccountingController => new AccountingController(
        $c->get(PDO::class),
        $c->get(AuditLogger::class),
        $c->get(PermissionService::class)
    ));

    $container->set(DashboardController::class, static fn(Container $c): DashboardController => new DashboardController(
        $c->get(PDO::class),
        $c->get(PermissionService::class)
    ));


    return $container;
};
