<?php
declare(strict_types=1);

namespace Zekron\Security;

use Zekron\Support\Env;

final class Jwt
{
    public static function encode(array $payload): string
    {
        $secret = Env::getRequired('JWT_SECRET');
        $ttlH = Env::int('JWT_TTL_HOURS', 720);
        $now = time();
        $payload = array_merge([
            'iat' => $now,
            'nbf' => $now,
            'exp' => $now + $ttlH * 3600,
        ], $payload);

        $header = self::b64UrlEncode(json_encode(['typ' => 'JWT', 'alg' => 'HS256'], JSON_UNESCAPED_SLASHES));
        $body   = self::b64UrlEncode(json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
        $sig    = self::b64UrlEncode(hash_hmac('sha256', $header . '.' . $body, $secret, true));
        return $header . '.' . $body . '.' . $sig;
    }

    public static function decode(string $token): ?array
    {
        $secret = Env::getRequired('JWT_SECRET');
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        [$h, $b, $s] = $parts;
        $expected = self::b64UrlEncode(hash_hmac('sha256', $h . '.' . $b, $secret, true));
        if (!hash_equals($expected, $s)) {
            return null;
        }
        $payload = json_decode(self::b64UrlDecode($b), true);
        if (!is_array($payload)) {
            return null;
        }
        $now = time();
        if (isset($payload['nbf']) && $now < (int) $payload['nbf']) {
            return null;
        }
        if (isset($payload['exp']) && $now >= (int) $payload['exp']) {
            return null;
        }
        return $payload;
    }

    private static function b64UrlEncode(string $bin): string
    {
        return rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
    }

    private static function b64UrlDecode(string $str): string
    {
        $pad = strlen($str) % 4;
        if ($pad) {
            $str .= str_repeat('=', 4 - $pad);
        }
        return base64_decode(strtr($str, '-_', '+/')) ?: '';
    }
}
