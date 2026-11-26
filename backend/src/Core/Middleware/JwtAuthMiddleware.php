<?php

declare(strict_types=1);
namespace App\Core\Middleware;

use App\Core\Auth\SessionAuthService;
use App\Core\Http\JsonResponder;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface as Handler;
use Slim\Psr7\Response as SlimResponse;
use Throwable;

final class JwtAuthMiddleware implements MiddlewareInterface {
    public function __construct(private SessionAuthService $authService) {}

    public function process(Request $request, Handler $handler): Response {
        $authHeader = $request->getHeaderLine('Authorization');
        if (!str_starts_with($authHeader, 'Bearer ')) {
            return JsonResponder::error(new SlimResponse(), 'Authentication token missing.', 'UNAUTHENTICATED', 401);
        }

        $jwt = substr($authHeader, 7);
        $deviceId = $request->getHeaderLine('X-Device-ID') ?: 'unknown-device';
        $userAgent = $request->getHeaderLine('User-Agent');

        try {
            $claims = $this->authService->verifyAccessToken($jwt, $deviceId, $userAgent);
        } catch (Throwable) {
            return JsonResponder::error(new SlimResponse(), 'Invalid or expired session token.', 'TOKEN_INVALID', 401);
        }

        $request = $request
            ->withAttribute('auth_user_id', $claims['sub'])
            ->withAttribute('auth_account_id', $claims['acc'])
            ->withAttribute('auth_session_id', $claims['sid'])
            ->withAttribute('auth_is_owner', filter_var($claims['is_owner'] ?? false, FILTER_VALIDATE_BOOLEAN))
            ->withAttribute('device_id', $deviceId);

        return $handler->handle($request);
    }
}
