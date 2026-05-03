<?php
declare(strict_types=1);

namespace Zekron\Http;

use Zekron\Database\DB;
use Zekron\Security\Jwt;

final class Middleware
{
    /** Returns ['user' => array] on success, or 401s. */
    public static function auth(): \Closure
    {
        return static function (array $context): array {
            $token = Request::bearerToken();
            if (!$token) {
                // Cookie fallback
                $token = $_COOKIE['zekron_token'] ?? null;
            }
            if (!$token) {
                Response::error('unauthorized', 'Missing auth token', 401);
            }
            $payload = Jwt::decode($token);
            if (!$payload || !isset($payload['sub'])) {
                Response::error('unauthorized', 'Invalid or expired token', 401);
            }
            $user = DB::fetchOne(
                'SELECT id, email, name, avatar_url, is_admin, is_active, balance_usd
                 FROM users WHERE id = ? LIMIT 1',
                [(int) $payload['sub']]
            );
            if (!$user || (int) $user['is_active'] !== 1) {
                Response::error('unauthorized', 'User not found or inactive', 401);
            }
            return ['user' => $user];
        };
    }

    public static function admin(): \Closure
    {
        return static function (array $context): array {
            $extra = (self::auth())($context);
            $user = $extra['user'];
            if ((int) $user['is_admin'] !== 1) {
                Response::error('forbidden', 'Admin access required', 403);
            }
            return $extra;
        };
    }
}
