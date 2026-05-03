<?php
declare(strict_types=1);

namespace Zekron\Http;

final class Request
{
    /** @var array<string,mixed>|null */
    private static ?array $jsonCache = null;

    /** @return array<string,mixed> */
    public static function json(): array
    {
        if (self::$jsonCache !== null) {
            return self::$jsonCache;
        }
        $raw = file_get_contents('php://input') ?: '';
        if ($raw === '') {
            return self::$jsonCache = [];
        }
        $data = json_decode($raw, true);
        if (!is_array($data)) {
            return self::$jsonCache = [];
        }
        return self::$jsonCache = $data;
    }

    public static function input(string $key, mixed $default = null): mixed
    {
        $body = self::json();
        if (array_key_exists($key, $body)) {
            return $body[$key];
        }
        if (array_key_exists($key, $_GET)) {
            return $_GET[$key];
        }
        if (array_key_exists($key, $_POST)) {
            return $_POST[$key];
        }
        return $default;
    }

    public static function query(string $key, mixed $default = null): mixed
    {
        return $_GET[$key] ?? $default;
    }

    public static function bearerToken(): ?string
    {
        $headers = self::headers();
        $auth = $headers['authorization'] ?? null;
        if (!$auth) {
            return null;
        }
        if (preg_match('/^Bearer\s+(.+)$/i', $auth, $m)) {
            return trim($m[1]);
        }
        return null;
    }

    /** @return array<string,string> */
    public static function headers(): array
    {
        $out = [];
        foreach ($_SERVER as $k => $v) {
            if (str_starts_with($k, 'HTTP_')) {
                $name = strtolower(str_replace('_', '-', substr($k, 5)));
                $out[$name] = (string) $v;
            }
        }
        // Some hosts pass auth via REDIRECT_HTTP_AUTHORIZATION
        if (!isset($out['authorization']) && !empty($_SERVER['HTTP_AUTHORIZATION'])) {
            $out['authorization'] = (string) $_SERVER['HTTP_AUTHORIZATION'];
        }
        if (!isset($out['authorization']) && !empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $out['authorization'] = (string) $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }
        return $out;
    }

    public static function ip(): string
    {
        return (string) ($_SERVER['HTTP_X_FORWARDED_FOR']
            ?? $_SERVER['REMOTE_ADDR']
            ?? '');
    }

    public static function userAgent(): string
    {
        return (string) ($_SERVER['HTTP_USER_AGENT'] ?? '');
    }
}
