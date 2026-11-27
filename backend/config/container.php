<?php

declare(strict_types=1);

use App\Core\Accounting\AccountingController;
use App\Core\Agriculture\AgricultureController;
use App\Core\Agriculture\FarmCycleService;
use App\Core\Agriculture\FarmInputService;
use App\Core\Auth\AuthController;
use App\Core\Auth\SessionAuthService;
use App\Core\Billing\BillingController;
use App\Core\Billing\Gateways\FlutterwaveGateway;
use App\Core\Billing\Gateways\PaystackGateway;
use App\Core\Contacts\CustomerController;
use App\Core\Contacts\CustomerService;
use App\Core\Contacts\SupplierController;
use App\Core\Contacts\SupplierService;
use App\Core\Creative\ClientPortalController;
use App\Core\Creative\CreativeBillingService;
use App\Core\Creative\CreativeProjectController;
use App\Core\Creative\CreativeProjectService;
use App\Core\Creative\ProjectClientNotifier;
use App\Core\Inventory\CatalogController;
use App\Core\Inventory\InventoryLedgerService;
use App\Core\Inventory\StockTransferController;
use App\Core\Middleware\JwtAuthMiddleware;
use App\Core\Middleware\SubscriptionGuardMiddleware;
use App\Core\Notifications\MailerService;
use App\Core\Pos\PosSalesController;
use App\Core\Pos\PosShiftController;
use App\Core\Pos\SaleCheckoutService;
use App\Core\Pos\SaleCustomerCreditService;
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

    $container->set(SaleCustomerCreditService::class, static fn(Container $c): SaleCustomerCreditService => new SaleCustomerCreditService(
        $c->get(PDO::class)
    ));

    $container->set(SaleCheckoutService::class, static fn(Container $c): SaleCheckoutService => new SaleCheckoutService(
        $c->get(PDO::class),
        $c->get(InventoryLedgerService::class),
        $c->get(SaleCustomerCreditService::class)
    ));

    $container->set(PosSalesController::class, static fn(Container $c): PosSalesController => new PosSalesController(
        $c->get(PDO::class),
        $c->get(SaleCheckoutService::class),
        $c->get(AuditLogger::class),
        $c->get(PermissionService::class)
    ));

    $container->set(PosShiftController::class, static fn(Container $c): PosShiftController => new PosShiftController(
        $c->get(PDO::class),
        $c->get(AuditLogger::class),
        $c->get(SessionAuthService::class),
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

    $container->set(AgricultureController::class, static fn(Container $c): AgricultureController => new AgricultureController(
        $c->get(FarmCycleService::class),
        $c->get(FarmInputService::class),
        $c->get(AuditLogger::class),
        $c->get(PermissionService::class),
    ));

    $container->set(CustomerService::class, static fn(Container $c): CustomerService => new CustomerService($c->get(PDO::class)));
    $container->set(SupplierService::class, static fn(Container $c): SupplierService => new SupplierService($c->get(PDO::class)));
    
    
    $container->set(CustomerController::class, static fn(Container $c): CustomerController => new CustomerController(
        $c->get(CustomerService::class),
        $c->get(PermissionService::class),
        $c->get(AuditLogger::class)
    ));
    $container->set(SupplierController::class, static fn(Container $c): SupplierController => new SupplierController(
        $c->get(SupplierService::class),
        $c->get(PermissionService::class),
        $c->get(AuditLogger::class)
    ));

    
    $container->set(CreativeProjectService::class, static fn(Container $c): CreativeProjectService => new CreativeProjectService($c->get(PDO::class)));
    $container->set(CreativeBillingService::class, static fn(Container $c): CreativeBillingService => new CreativeBillingService($c->get(PDO::class)));
    $container->set(CreativeProjectController::class, static fn(Container $c): CreativeProjectController => new CreativeProjectController(
        $c->get(CreativeProjectService::class),
        $c->get(CreativeBillingService::class),
        $c->get(PermissionService::class),
        $c->get(AuditLogger::class),
        $c->get(ProjectClientNotifier::class)
    ));
    $container->set(ClientPortalController::class, static fn(Container $c): ClientPortalController => new ClientPortalController(
        $c->get(PDO::class)
    ));

    $container->set(ProjectClientNotifier::class, static fn(Container $c): ProjectClientNotifier => new ProjectClientNotifier(
        $c->get(PDO::class),
        $c->get(MailerService::class)
    ));

 




return $container;
};
