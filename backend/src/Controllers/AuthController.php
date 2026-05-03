<?php
declare(strict_types=1);

namespace Zekron\Controllers;

use Zekron\Database\DB;
use Zekron\Http\Request;
use Zekron\Http\Response;
use Zekron\Security\Jwt;
use Zekron\Services\GoogleOAuth;
use Zekron\Support\Env;

final class AuthController
{
    public static function register(): void
    {
        $email    = trim((string) Request::input('email', ''));
        $password = (string) Request::input('password', '');
        $name     = trim((string) Request::input('name', ''));

        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('invalid_email', 'Please enter a valid email address.', 422);
        }
        if (strlen($password) < 8) {
            Response::error('weak_password', 'Password must be at least 8 characters.', 422);
        }

        $existing = DB::fetchOne('SELECT id FROM users WHERE email = ? LIMIT 1', [$email]);
        if ($existing) {
            Response::error('email_taken', 'An account with this email already exists.', 409);
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);
        $userId = DB::insert(
            'INSERT INTO users (email, password_hash, name, is_admin, is_active, email_verified_at, last_login_at)
             VALUES (?, ?, ?, 0, 1, NULL, NOW())',
            [$email, $hash, $name !== '' ? $name : null]
        );

        $token = self::issueToken($userId);
        $user = self::fetchUser($userId);

        Response::json(['token' => $token, 'user' => $user], 201);
    }

    public static function login(): void
    {
        $email    = trim((string) Request::input('email', ''));
        $password = (string) Request::input('password', '');

        if ($email === '' || $password === '') {
            Response::error('missing_credentials', 'Email and password are required.', 422);
        }

        $user = DB::fetchOne(
            'SELECT id, password_hash, is_active FROM users WHERE email = ? LIMIT 1',
            [$email]
        );
        if (!$user || !$user['password_hash'] || !password_verify($password, $user['password_hash'])) {
            Response::error('invalid_credentials', 'Incorrect email or password.', 401);
        }
        if ((int) $user['is_active'] !== 1) {
            Response::error('account_disabled', 'This account is disabled.', 403);
        }

        DB::execute('UPDATE users SET last_login_at = NOW() WHERE id = ?', [(int) $user['id']]);

        $token = self::issueToken((int) $user['id']);
        $full  = self::fetchUser((int) $user['id']);

        Response::json(['token' => $token, 'user' => $full]);
    }

    public static function me(array $ctx): void
    {
        Response::json(['user' => self::fetchUser((int) $ctx['user']['id'])]);
    }

    public static function logout(array $ctx): void
    {
        // JWT is stateless; the client should drop the token. Still, expire cookie.
        setcookie('zekron_token', '', [
            'expires'  => time() - 3600,
            'path'     => '/',
            'secure'   => true,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        Response::json(['ok' => true]);
    }

    public static function googleStart(): void
    {
        if (!Env::get('GOOGLE_CLIENT_ID')) {
            Response::error('google_disabled', 'Google sign-in is not configured.', 400);
        }
        $state = bin2hex(random_bytes(24));
        $redirectTo = (string) Request::query('redirect_to', Env::get('FRONTEND_URL', '/'));
        DB::execute(
            'INSERT INTO oauth_states (state, redirect_to, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))',
            [$state, $redirectTo]
        );
        $url = GoogleOAuth::buildAuthUrl($state);
        Response::redirect($url);
    }

    public static function googleCallback(): void
    {
        $state = (string) Request::query('state', '');
        $code  = (string) Request::query('code', '');
        $error = (string) Request::query('error', '');

        $frontendUrl = Env::get('FRONTEND_URL', '/');

        if ($error !== '') {
            Response::redirect(rtrim((string) $frontendUrl, '/') . '/login?error=' . urlencode($error));
        }
        if ($state === '' || $code === '') {
            Response::redirect(rtrim((string) $frontendUrl, '/') . '/login?error=invalid_oauth');
        }

        $row = DB::fetchOne(
            'SELECT id, redirect_to FROM oauth_states WHERE state = ? AND expires_at > NOW() LIMIT 1',
            [$state]
        );
        if (!$row) {
            Response::redirect(rtrim((string) $frontendUrl, '/') . '/login?error=expired_state');
        }
        DB::execute('DELETE FROM oauth_states WHERE id = ?', [(int) $row['id']]);

        try {
            $profile = GoogleOAuth::exchangeCodeForProfile($code);
        } catch (\Throwable $e) {
            error_log('[zekron] Google OAuth: ' . $e->getMessage());
            Response::redirect(rtrim((string) $frontendUrl, '/') . '/login?error=oauth_failed');
        }

        $email     = strtolower((string) ($profile['email'] ?? ''));
        $googleId  = (string) ($profile['sub']   ?? '');
        $name      = (string) ($profile['name']  ?? '');
        $avatarUrl = (string) ($profile['picture'] ?? '');

        if ($email === '' || $googleId === '') {
            Response::redirect(rtrim((string) $frontendUrl, '/') . '/login?error=oauth_no_email');
        }

        $user = DB::fetchOne(
            'SELECT id FROM users WHERE google_id = ? OR email = ? LIMIT 1',
            [$googleId, $email]
        );
        if ($user) {
            $userId = (int) $user['id'];
            DB::execute(
                'UPDATE users SET google_id = COALESCE(google_id, ?), name = COALESCE(NULLIF(name,""), ?), avatar_url = ?, last_login_at = NOW(), email_verified_at = COALESCE(email_verified_at, NOW())
                 WHERE id = ?',
                [$googleId, $name, $avatarUrl, $userId]
            );
        } else {
            $userId = DB::insert(
                'INSERT INTO users (email, google_id, name, avatar_url, is_admin, is_active, email_verified_at, last_login_at)
                 VALUES (?, ?, ?, ?, 0, 1, NOW(), NOW())',
                [$email, $googleId, $name !== '' ? $name : null, $avatarUrl !== '' ? $avatarUrl : null]
            );
        }

        $token = self::issueToken($userId);

        // Set cookie *and* pass token in the redirect so the SPA can pick it up.
        $target = $row['redirect_to'] ?: rtrim((string) $frontendUrl, '/');
        $sep = str_contains((string) $target, '?') ? '&' : '?';
        Response::redirect($target . $sep . 'token=' . urlencode($token));
    }

    private static function issueToken(int $userId): string
    {
        return Jwt::encode(['sub' => $userId]);
    }

    private static function fetchUser(int $userId): ?array
    {
        return DB::fetchOne(
            'SELECT id, email, name, avatar_url, is_admin, balance_usd, created_at
             FROM users WHERE id = ? LIMIT 1',
            [$userId]
        );
    }
}
