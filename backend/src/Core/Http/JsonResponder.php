<?php

declare(strict_types=1);
namespace App\Core\Http;
use Psr\Http\Message\ResponseInterface as Response;

final class JsonResponder {
    public static function success(Response $response, array $data = [], int $status = 200): Response {
        $payload = json_encode(['status' => 'success', 'data' => $data], JSON_UNESCAPED_UNICODE);
        $response->getBody()->write($payload ?: '{}');
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }

    public static function error(Response $response, string $message, string $code = 'ERROR', int $status = 400, array $details = []): Response {
        $body = ['status' => 'error', 'code' => $code, 'message' => $message];
        if (!empty($details)) {
            $body['details'] = $details;
        }
        $payload = json_encode($body, JSON_UNESCAPED_UNICODE);
        $response->getBody()->write($payload ?: '{}');
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
}
