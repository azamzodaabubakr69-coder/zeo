<?php
declare(strict_types=1);

namespace Zekron\Controllers;

use Zekron\Database\DB;
use Zekron\Http\Request;
use Zekron\Http\Response;
use Zekron\Security\Crypto;

final class AdminController
{
    // -------------------- USERS --------------------

    public static function listUsers(array $ctx): void
    {
        $q = trim((string) Request::query('q', ''));
        $limit = min(200, max(1, (int) Request::query('limit', 100)));

        if ($q !== '') {
            $rows = DB::fetchAll(
                'SELECT id, email, name, avatar_url, is_admin, is_active, balance_usd, last_login_at, created_at
                 FROM users
                 WHERE email LIKE ? OR name LIKE ?
                 ORDER BY id DESC
                 LIMIT ?',
                ["%{$q}%", "%{$q}%", $limit]
            );
        } else {
            $rows = DB::fetchAll(
                'SELECT id, email, name, avatar_url, is_admin, is_active, balance_usd, last_login_at, created_at
                 FROM users
                 ORDER BY id DESC
                 LIMIT ?',
                [$limit]
            );
        }
        Response::json(['users' => $rows]);
    }

    public static function updateUser(array $ctx): void
    {
        $id = (int) ($ctx['params']['id'] ?? 0);
        if ($id <= 0) {
            Response::error('invalid_id', 'Invalid user id', 422);
        }
        $body = Request::json();
        $fields = [];
        $params = [];
        foreach (['name', 'is_admin', 'is_active', 'balance_usd'] as $key) {
            if (array_key_exists($key, $body)) {
                $fields[] = "`{$key}` = ?";
                $params[] = $key === 'name' ? (string) $body[$key] : (is_bool($body[$key]) ? (int) $body[$key] : $body[$key]);
            }
        }
        if (empty($fields)) {
            Response::error('nothing_to_update', 'No editable fields provided', 422);
        }
        $params[] = $id;
        DB::execute('UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = ?', $params);
        $row = DB::fetchOne(
            'SELECT id, email, name, avatar_url, is_admin, is_active, balance_usd, last_login_at, created_at
             FROM users WHERE id = ?',
            [$id]
        );
        Response::json(['user' => $row]);
    }

    public static function deleteUser(array $ctx): void
    {
        $id = (int) ($ctx['params']['id'] ?? 0);
        if ($id <= 0) {
            Response::error('invalid_id', 'Invalid user id', 422);
        }
        if ($id === (int) $ctx['user']['id']) {
            Response::error('self_delete', 'You cannot delete your own account.', 400);
        }
        DB::execute('DELETE FROM users WHERE id = ?', [$id]);
        Response::json(['ok' => true]);
    }

    // -------------------- MODELS --------------------

    public static function listModels(array $ctx): void
    {
        $rows = DB::fetchAll('SELECT * FROM ai_models ORDER BY sort_order DESC, id ASC');
        $rows = array_map(fn($r) => ModelController::publicView($r, true), $rows);
        Response::json(['models' => $rows]);
    }

    public static function createModel(array $ctx): void
    {
        $b = Request::json();
        $required = ['slug', 'display_name', 'provider_model'];
        foreach ($required as $k) {
            if (empty($b[$k])) {
                Response::error('missing_field', "Field {$k} is required", 422);
            }
        }
        $id = DB::insert(
            'INSERT INTO ai_models
              (slug, display_name, description, provider, provider_model,
               made_by_label, made_by_logo_svg, logo_svg,
               price_input_per_mtok, price_output_per_mtok,
               max_output_tokens, context_window,
               supports_thinking, supports_vision, system_prompt,
               is_active, is_default, sort_order)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [
                $b['slug'],
                $b['display_name'],
                $b['description'] ?? null,
                $b['provider'] ?? 'anthropic',
                $b['provider_model'],
                $b['made_by_label'] ?? 'Claude',
                $b['made_by_logo_svg'] ?? null,
                $b['logo_svg'] ?? null,
                (float) ($b['price_input_per_mtok'] ?? 0),
                (float) ($b['price_output_per_mtok'] ?? 0),
                (int)   ($b['max_output_tokens'] ?? 4096),
                (int)   ($b['context_window'] ?? 200000),
                !empty($b['supports_thinking']) ? 1 : 0,
                !empty($b['supports_vision'])   ? 1 : 0,
                $b['system_prompt'] ?? null,
                array_key_exists('is_active', $b) ? (!empty($b['is_active']) ? 1 : 0) : 1,
                !empty($b['is_default']) ? 1 : 0,
                (int) ($b['sort_order'] ?? 0),
            ]
        );
        $row = DB::fetchOne('SELECT * FROM ai_models WHERE id = ?', [$id]);
        Response::json(['model' => ModelController::publicView($row, true)], 201);
    }

    public static function updateModel(array $ctx): void
    {
        $id = (int) ($ctx['params']['id'] ?? 0);
        $row = DB::fetchOne('SELECT * FROM ai_models WHERE id = ?', [$id]);
        if (!$row) {
            Response::error('not_found', 'Model not found', 404);
        }
        $b = Request::json();
        $allowed = [
            'slug', 'display_name', 'description', 'provider', 'provider_model',
            'made_by_label', 'made_by_logo_svg', 'logo_svg',
            'price_input_per_mtok', 'price_output_per_mtok',
            'max_output_tokens', 'context_window',
            'supports_thinking', 'supports_vision', 'system_prompt',
            'is_active', 'is_default', 'sort_order',
        ];
        $fields = [];
        $params = [];
        foreach ($allowed as $k) {
            if (!array_key_exists($k, $b)) {
                continue;
            }
            $fields[] = "`{$k}` = ?";
            $val = $b[$k];
            if (in_array($k, ['supports_thinking','supports_vision','is_active','is_default'], true)) {
                $val = !empty($val) ? 1 : 0;
            }
            $params[] = $val;
        }
        if (empty($fields)) {
            Response::json(['model' => ModelController::publicView($row, true)]);
        }
        $params[] = $id;
        DB::execute('UPDATE ai_models SET ' . implode(', ', $fields) . ' WHERE id = ?', $params);
        $row = DB::fetchOne('SELECT * FROM ai_models WHERE id = ?', [$id]);
        Response::json(['model' => ModelController::publicView($row, true)]);
    }

    public static function deleteModel(array $ctx): void
    {
        $id = (int) ($ctx['params']['id'] ?? 0);
        DB::execute('DELETE FROM ai_models WHERE id = ?', [$id]);
        Response::json(['ok' => true]);
    }

    // -------------------- API KEYS --------------------

    public static function listApiKeys(array $ctx): void
    {
        $rows = DB::fetchAll(
            'SELECT id, provider, label, key_last4, is_active, priority, last_used_at, created_at, updated_at
             FROM api_keys ORDER BY priority DESC, id DESC'
        );
        Response::json(['api_keys' => $rows]);
    }

    public static function createApiKey(array $ctx): void
    {
        $b = Request::json();
        $provider = trim((string) ($b['provider'] ?? 'anthropic'));
        $label    = trim((string) ($b['label'] ?? ''));
        $key      = (string) ($b['key'] ?? '');
        if ($provider === '' || $key === '' || $label === '') {
            Response::error('missing_field', 'provider, label and key are required', 422);
        }
        $encrypted = Crypto::encrypt($key);
        $last4 = strlen($key) >= 4 ? substr($key, -4) : $key;
        $id = DB::insert(
            'INSERT INTO api_keys (provider, label, key_encrypted, key_last4, is_active, priority)
             VALUES (?, ?, ?, ?, ?, ?)',
            [$provider, $label, $encrypted, $last4,
             array_key_exists('is_active', $b) ? (!empty($b['is_active']) ? 1 : 0) : 1,
             (int) ($b['priority'] ?? 0)]
        );
        $row = DB::fetchOne(
            'SELECT id, provider, label, key_last4, is_active, priority, last_used_at, created_at, updated_at
             FROM api_keys WHERE id = ?', [$id]);
        Response::json(['api_key' => $row], 201);
    }

    public static function updateApiKey(array $ctx): void
    {
        $id = (int) ($ctx['params']['id'] ?? 0);
        $row = DB::fetchOne('SELECT * FROM api_keys WHERE id = ?', [$id]);
        if (!$row) {
            Response::error('not_found', 'API key not found', 404);
        }
        $b = Request::json();
        $fields = [];
        $params = [];
        foreach (['provider', 'label', 'priority', 'is_active'] as $k) {
            if (array_key_exists($k, $b)) {
                $fields[] = "`{$k}` = ?";
                $val = $b[$k];
                if ($k === 'is_active') {
                    $val = !empty($val) ? 1 : 0;
                }
                $params[] = $val;
            }
        }
        if (!empty($b['key'])) {
            $fields[] = '`key_encrypted` = ?';
            $params[] = Crypto::encrypt((string) $b['key']);
            $fields[] = '`key_last4` = ?';
            $params[] = substr((string) $b['key'], -4);
        }
        if (empty($fields)) {
            Response::error('nothing_to_update', 'No fields to update', 422);
        }
        $params[] = $id;
        DB::execute('UPDATE api_keys SET ' . implode(', ', $fields) . ' WHERE id = ?', $params);
        $row = DB::fetchOne(
            'SELECT id, provider, label, key_last4, is_active, priority, last_used_at, created_at, updated_at
             FROM api_keys WHERE id = ?', [$id]);
        Response::json(['api_key' => $row]);
    }

    public static function deleteApiKey(array $ctx): void
    {
        $id = (int) ($ctx['params']['id'] ?? 0);
        DB::execute('DELETE FROM api_keys WHERE id = ?', [$id]);
        Response::json(['ok' => true]);
    }

    // -------------------- USAGE LOGS --------------------

    public static function usageLogs(array $ctx): void
    {
        $userId = (int) Request::query('user_id', 0);
        $limit  = min(500, max(1, (int) Request::query('limit', 100)));
        if ($userId > 0) {
            $rows = DB::fetchAll(
                'SELECT u.*, m.display_name AS model_display_name, usr.email AS user_email
                 FROM usage_logs u
                 LEFT JOIN ai_models m ON m.id = u.model_id
                 LEFT JOIN users usr   ON usr.id = u.user_id
                 WHERE u.user_id = ?
                 ORDER BY u.id DESC LIMIT ?',
                [$userId, $limit]
            );
        } else {
            $rows = DB::fetchAll(
                'SELECT u.*, m.display_name AS model_display_name, usr.email AS user_email
                 FROM usage_logs u
                 LEFT JOIN ai_models m ON m.id = u.model_id
                 LEFT JOIN users usr   ON usr.id = u.user_id
                 ORDER BY u.id DESC LIMIT ?',
                [$limit]
            );
        }
        Response::json(['logs' => $rows]);
    }

    public static function stats(array $ctx): void
    {
        $totals = DB::fetchOne('SELECT
            (SELECT COUNT(*) FROM users) AS users_total,
            (SELECT COUNT(*) FROM users WHERE is_admin = 1) AS admins_total,
            (SELECT COUNT(*) FROM ai_models WHERE is_active = 1) AS active_models,
            (SELECT COUNT(*) FROM chats) AS chats_total,
            (SELECT COUNT(*) FROM messages) AS messages_total,
            (SELECT COALESCE(SUM(cost_usd),0) FROM usage_logs) AS revenue_usd,
            (SELECT COALESCE(SUM(input_tokens),0) FROM usage_logs) AS input_tokens_total,
            (SELECT COALESCE(SUM(output_tokens),0) FROM usage_logs) AS output_tokens_total
        ');
        Response::json(['stats' => $totals]);
    }

    // -------------------- BILLING --------------------

    public static function topup(array $ctx): void
    {
        $b = Request::json();
        $userId = (int) ($b['user_id'] ?? 0);
        $amount = (float) ($b['amount'] ?? 0);
        $desc   = (string) ($b['description'] ?? 'Manual top-up');
        if ($userId <= 0 || $amount === 0.0) {
            Response::error('invalid_input', 'user_id and non-zero amount are required', 422);
        }
        $type = $amount > 0 ? 'topup' : 'adjustment';
        DB::execute('UPDATE users SET balance_usd = balance_usd + ? WHERE id = ?', [$amount, $userId]);
        DB::insert(
            'INSERT INTO billing_transactions (user_id, amount_usd, type, description, created_by) VALUES (?, ?, ?, ?, ?)',
            [$userId, $amount, $type, $desc, (int) $ctx['user']['id']]
        );
        $user = DB::fetchOne('SELECT id, email, balance_usd FROM users WHERE id = ?', [$userId]);
        Response::json(['user' => $user]);
    }

    // -------------------- SETTINGS --------------------

    public static function listSettings(array $ctx): void
    {
        $rows = DB::fetchAll('SELECT setting_key, setting_value, is_secret FROM settings ORDER BY setting_key');
        Response::json(['settings' => $rows]);
    }

    public static function setSetting(array $ctx): void
    {
        $b = Request::json();
        $key = (string) ($b['key'] ?? '');
        $val = (string) ($b['value'] ?? '');
        $secret = !empty($b['is_secret']) ? 1 : 0;
        if ($key === '') {
            Response::error('missing_key', 'Setting key required', 422);
        }
        DB::execute(
            'INSERT INTO settings (setting_key, setting_value, is_secret) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), is_secret = VALUES(is_secret)',
            [$key, $val, $secret]
        );
        Response::json(['ok' => true]);
    }
}
