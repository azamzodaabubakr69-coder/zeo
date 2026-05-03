<?php
declare(strict_types=1);

namespace Zekron\Http;

use Zekron\Support\Env;

final class Cors
{
    public static function handle(): void
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowed = array_filter(array_map('trim',
            explode(',', Env::get('CORS_ALLOWED_ORIGINS', '') ?? '')
        ));

        $allowOrigin = null;
        if ($origin !== '' && in_array($origin, $allowed, true)) {
            $allowOrigin = $origin;
        } elseif (!empty($allowed)) {
            $allowOrigin = $allowed[0];
        } else {
            $allowOrigin = '*';
        }

        header('Access-Control-Allow-Origin: ' . $allowOrigin);
        header('Vary: Origin');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Max-Age: 86400');

        if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
