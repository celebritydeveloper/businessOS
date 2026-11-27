<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173';
if (in_array($origin, ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://fast-business-os-app.vercel.app'], true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Device-ID, X-Device-Name, X-Request-Nonce, X-Timestamp');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

use App\Core\Accounting\AccountingController;
use App\Core\Agriculture\AgricultureController;
use App\Core\Auth\AuthController;
use App\Core\Billing\BillingController;
use App\Core\Contacts\ContactsController;
use App\Core\Contacts\CustomerController;
use App\Core\Contacts\SupplierController;
use App\Core\Creative\ClientPortalController;
use App\Core\Creative\CreativeProjectController;
use App\Core\Http\JsonResponder;
use App\Core\Inventory\CatalogController;
use App\Core\Inventory\StockTransferController;
use App\Core\Middleware\JwtAuthMiddleware;
use App\Core\Middleware\SecurityHeadersMiddleware;
use App\Core\Middleware\SubscriptionGuardMiddleware;
use App\Core\Pos\PosController;
use App\Core\Security\AuditLogController;
use App\Core\Tenancy\BrandingController;
use App\Core\Tenancy\DashboardController;
use App\Core\Tenancy\OnboardingController;
use App\Core\Tenancy\StaffController;
use Dotenv\Dotenv;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use Slim\Psr7\Response as SlimResponse;
use Slim\Routing\RouteCollectorProxy;

$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();


$allowedOrigins = array_filter(array_map('trim', explode(',', (string) ($_ENV['CORS_ALLOWED_ORIGINS'] ?? getenv('CORS_ALLOWED_ORIGINS') ?: 'http://localhost:5173, , http://127.0.0.1:5173'))));
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Device-ID, X-Device-Name, X-Request-Nonce, X-Timestamp');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$containerFactory = require __DIR__ . '/../config/container.php';
$container = $containerFactory();

AppFactory::setContainer($container);
$app = AppFactory::create();
$app->addBodyParsingMiddleware();
$app->addRoutingMiddleware();
$app->add(SecurityHeadersMiddleware::class);

$debug = ($_ENV['APP_DEBUG'] ?? 'false') === 'true';
$errorMiddleware = $app->addErrorMiddleware($debug, true, true);
$errorMiddleware->setDefaultErrorHandler(function (Request $request, Throwable $e, bool $displayErrorDetails): Response {
    error_log('[API Error] ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    $msg = $displayErrorDetails ? $e->getMessage() : 'Internal server error.';
    return JsonResponder::error(new SlimResponse(), $msg, 'SERVER_ERROR', 500);
});


$app->group('/api/v1', function (RouteCollectorProxy $api): void {
    $api->get('/health', function (Request $req, Response $res): Response {
        return JsonResponder::success($res, ['status' => 'ok']);
    });
    $api->get('/public/projects/{token}', [ClientPortalController::class, 'showByToken']);
    $api->get('/plans', [BillingController::class, 'listPlans']);
    $api->post('/auth/register', [AuthController::class, 'register']);
    $api->post('/auth/verify-email', [AuthController::class, 'verifyEmail']);
    $api->post('/auth/resend-verification', [AuthController::class, 'resendVerification']);
    $api->post('/auth/login', [AuthController::class, 'login']);
    $api->post('/auth/refresh', [AuthController::class, 'refresh']);
    $api->post('/auth/accept-invite', [StaffController::class, 'acceptInvite']);
    $api->post('/billing/webhook/{gateway}', [BillingController::class, 'handleWebhook']);
    

    $api->group('', function (RouteCollectorProxy $auth): void {
        $auth->post('/auth/logout', [AuthController::class, 'logout']);
        $auth->get('/me', [OnboardingController::class, 'me']);
        $auth->patch('/me/security', [StaffController::class, 'updateOwnSecurity']);
        $auth->post('/onboarding/business', [OnboardingController::class, 'createInitialBusiness']);
        $auth->post('/billing/initialize', [BillingController::class, 'initializeCheckout']);
        $auth->get('/billing/verify', [BillingController::class, 'verifyCallback']);
        $auth->get('/billing/overview', [BillingController::class, 'overview']);
    })->add(JwtAuthMiddleware::class);

    $api->group('/workspace', function (RouteCollectorProxy $ws): void {
        $ws->post('/businesses', [OnboardingController::class, 'addBusiness']);
        $ws->post('/branches', [OnboardingController::class, 'addBranch']);
        $ws->get('/businesses/{businessId}/branding', [BrandingController::class, 'getBranding']);
        $ws->put('/businesses/{businessId}/branding', [BrandingController::class, 'updateBranding']);
        $ws->post('/businesses/{businessId}/branding/verify-domain', [BrandingController::class, 'verifyDomain']);
        $ws->get('/businesses/{businessId}/branches/{branchId}/catalog', [CatalogController::class, 'listCatalog']);
        $ws->get('/businesses/{businessId}/branches/{branchId}/overview', [DashboardController::class, 'getBranchOverview']);
        $ws->get('/businesses/{businessId}/branches/{branchId}/sales', [PosController::class, 'listSales']);
        $ws->post('/businesses/{businessId}/branches/{branchId}/sales', [PosController::class, 'recordSale']);
        $ws->get('/businesses/{businessId}/branches/{branchId}/pos/cashiers', [PosController::class, 'listBranchCashiers']);
        $ws->post('/businesses/{businessId}/branches/{branchId}/pos/switch-cashier', [PosController::class, 'switchCashierByPin']);
        $ws->post('/businesses/{businessId}/branches/{branchId}/pos/reset-pin', [PosController::class, 'resetPinWithPassword']);
        $ws->post('/businesses/{businessId}/catalog', [CatalogController::class, 'createItem']);
        $ws->put('/businesses/{businessId}/catalog/{itemId}', [CatalogController::class, 'updateItem']);
        $ws->post('/businesses/{businessId}/branches/{branchId}/stock-movements', [CatalogController::class, 'recordStockMovement']);
        $ws->get('/businesses/{businessId}/transfers', [StockTransferController::class, 'listTransfers']);
        $ws->post('/businesses/{businessId}/transfers', [StockTransferController::class, 'dispatchTransfer']);
        $ws->post('/businesses/{businessId}/transfers/{transferId}/receive', [StockTransferController::class, 'confirmReceipt']);
        $ws->get('/businesses/{businessId}/staff', [StaffController::class, 'listStaffAndRoles']);
        $ws->post('/businesses/{businessId}/roles', [StaffController::class, 'createCustomRole']);
        $ws->post('/businesses/{businessId}/staff', [StaffController::class, 'createStaff']);
        $ws->get('/businesses/{businessId}/accounting', [AccountingController::class, 'getReports']);
        $ws->post('/businesses/{businessId}/accounting/expenses', [AccountingController::class, 'recordExpense']);
        $ws->get('/businesses/{businessId}/branches/{branchId}/farm-cycles', [AgricultureController::class, 'listCycles']);
        $ws->post('/businesses/{businessId}/branches/{branchId}/farm-cycles', [AgricultureController::class, 'createCycle']);
        $ws->post('/businesses/{businessId}/branches/{branchId}/farm-cycles/{cycleId}/logs', [AgricultureController::class, 'recordCycleLog']);
        $ws->get('/businesses/{businessId}/branches/{branchId}/farm-inputs', [AgricultureController::class, 'listInputs']);
        $ws->post('/businesses/{businessId}/branches/{branchId}/farm-inputs', [AgricultureController::class, 'saveInput']);
        $ws->patch('/staff/{userId}/pin', [StaffController::class, 'updateStaffPin']);
        $ws->patch('/staff/{userId}/status', [StaffController::class, 'toggleStaffStatus']);
        $ws->post('/branches/{branchId}/verify-pin', [StaffController::class, 'verifyPosPin']);
        $ws->get('/businesses/{businessId}/audit-logs', [AuditLogController::class, 'listLogs']);
        $ws->get('/businesses/{businessId}/customers', [CustomerController::class, 'list']);
        $ws->post('/businesses/{businessId}/customers', [CustomerController::class, 'create']);
        $ws->patch('/businesses/{businessId}/customers/{customerId}', [CustomerController::class, 'update']);
        $ws->post('/businesses/{businessId}/customers/{customerId}/payments', [CustomerController::class, 'recordPayment']);
        $ws->get('/businesses/{businessId}/suppliers', [SupplierController::class, 'list']);
        $ws->post('/businesses/{businessId}/suppliers', [SupplierController::class, 'create']);
        $ws->patch('/businesses/{businessId}/suppliers/{supplierId}', [SupplierController::class, 'update']);
        $ws->post('/businesses/{businessId}/suppliers/{supplierId}/transactions', [SupplierController::class, 'recordTransaction']);

       

        $ws->get('/businesses/{businessId}/branches/{branchId}/projects', [CreativeProjectController::class, 'list']);
        $ws->post('/businesses/{businessId}/branches/{branchId}/projects', [CreativeProjectController::class, 'create']);
        $ws->patch('/businesses/{businessId}/projects/{projectId}/stage', [CreativeProjectController::class, 'updateStage']);
        $ws->post('/businesses/{businessId}/branches/{branchId}/projects/{projectId}/logs', [CreativeProjectController::class, 'addLog']);
        $ws->patch('/businesses/{businessId}/projects/{projectId}/logs/{logId}/toggle', [CreativeProjectController::class, 'toggleDeliverable']);
        $ws->post('/businesses/{businessId}/branches/{branchId}/projects/{projectId}/bill', [CreativeProjectController::class, 'billProject']);
        $ws->patch('/businesses/{businessId}/projects/{projectId}/delivery-url', [CreativeProjectController::class, 'setDeliveryUrl']);
    })->add(SubscriptionGuardMiddleware::class)->add(JwtAuthMiddleware::class);

    $api->get('/public/branding', [BrandingController::class, 'resolvePublicBranding']);
});


$app->run();
