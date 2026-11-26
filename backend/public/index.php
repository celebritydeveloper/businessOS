<?php

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:5173';
if (in_array($origin, ['http://localhost:5173', 'http://127.0.0.1:5173'], true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Device-ID, X-Device-Name, X-Request-Nonce, X-Timestamp');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

use App\Core\Auth\AuthController;
use App\Core\Billing\BillingController;
use App\Core\Http\JsonResponder;
use App\Core\Inventory\CatalogController;
use App\Core\Inventory\StockTransferController;
use App\Core\Middleware\JwtAuthMiddleware;
use App\Core\Middleware\SecurityHeadersMiddleware;
use App\Core\Middleware\SubscriptionGuardMiddleware;
use App\Core\Pos\PosController;
use App\Core\Tenancy\BrandingController;
use App\Core\Tenancy\OnboardingController;
use Dotenv\Dotenv;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;
use Slim\Psr7\Response as SlimResponse;
use Slim\Routing\RouteCollectorProxy;

$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

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
    $api->get('/plans', [BillingController::class, 'listPlans']);

    $api->post('/auth/register', [AuthController::class, 'register']);
    $api->post('/auth/verify-email', [AuthController::class, 'verifyEmail']);
    $api->post('/auth/resend-verification', [AuthController::class, 'resendVerification']);
    $api->post('/auth/login', [AuthController::class, 'login']);
    $api->post('/auth/refresh', [AuthController::class, 'refresh']);

    $api->post('/billing/webhook/{gateway}', [BillingController::class, 'handleWebhook']);

    $api->group('', function (RouteCollectorProxy $auth): void {
        $auth->post('/auth/logout', [AuthController::class, 'logout']);
        $auth->get('/me', [OnboardingController::class, 'me']);
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
        $ws->post('/businesses/{businessId}/catalog', [CatalogController::class, 'createItem']);
        $ws->post('/businesses/{businessId}/branches/{branchId}/stock-movements', [CatalogController::class, 'recordStockMovement']);
        $ws->get('/businesses/{businessId}/transfers', [StockTransferController::class, 'listTransfers']);
        $ws->post('/businesses/{businessId}/transfers', [StockTransferController::class, 'dispatchTransfer']);
        $ws->post('/businesses/{businessId}/transfers/{transferId}/receive', [StockTransferController::class, 'confirmReceipt']);
        $ws->get('/businesses/{businessId}/branches/{branchId}/sales', [PosController::class, 'listSales']);
        $ws->post('/businesses/{businessId}/branches/{branchId}/sales', [PosController::class, 'recordSale']);
    })->add(SubscriptionGuardMiddleware::class)->add(JwtAuthMiddleware::class);

    $api->get('/public/branding', [BrandingController::class, 'resolvePublicBranding']);
});


$app->run();
