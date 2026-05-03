<?php
declare(strict_types=1);

namespace Zekron\Controllers;

use Zekron\Database\DB;
use Zekron\Http\Request;
use Zekron\Http\Response;
use Zekron\Services\Anthropic;

final class ChatController
{
    /** RFC 4122 v4 UUID. */
    private static function uuid(): string
    {
        $b = random_bytes(16);
        $b[6] = chr((ord($b[6]) & 0x0f) | 0x40);
        $b[8] = chr((ord($b[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($b), 4));
    }

    private static function chatPublic(array $row): array
    {
        return [
            'id'                 => $row['uuid'],
            'uuid'               => $row['uuid'],
            'title'              => $row['title'],
            'model_id'           => $row['model_id'] !== null ? (int) $row['model_id'] : null,
            'model_display_name' => $row['model_display_name'] ?? null,
            'created_at'         => $row['created_at'],
            'updated_at'         => $row['updated_at'],
        ];
    }

    /** GET /api/chats */
    public static function listChats(array $ctx): void
    {
        $rows = DB::fetchAll(
            'SELECT c.id, c.uuid, c.title, c.created_at, c.updated_at, c.model_id,
                    m.display_name AS model_display_name
             FROM chats c
             LEFT JOIN ai_models m ON m.id = c.model_id
             WHERE c.user_id = ?
             ORDER BY c.updated_at DESC LIMIT 200',
            [(int) $ctx['user']['id']]
        );
        Response::json(['chats' => array_map([self::class, 'chatPublic'], $rows)]);
    }

    /** POST /api/chats */
    public static function createChat(array $ctx): void
    {
        $title = trim((string) Request::input('title', 'New chat'));
        $modelId = (int) Request::input('model_id', 0) ?: null;
        $uuid = self::uuid();
        DB::insert(
            'INSERT INTO chats (uuid, user_id, title, model_id) VALUES (?, ?, ?, ?)',
            [$uuid, (int) $ctx['user']['id'], $title !== '' ? $title : 'New chat', $modelId]
        );
        $row = DB::fetchOne(
            'SELECT c.id, c.uuid, c.title, c.created_at, c.updated_at, c.model_id,
                    m.display_name AS model_display_name
             FROM chats c LEFT JOIN ai_models m ON m.id = c.model_id
             WHERE c.uuid = ?',
            [$uuid]
        );
        Response::json(['chat' => self::chatPublic($row)], 201);
    }

    /** GET /api/chats/{id} where {id} is the UUID. */
    public static function getChat(array $ctx): void
    {
        $uuid = (string) ($ctx['params']['id'] ?? '');
        $chat = DB::fetchOne(
            'SELECT c.id, c.uuid, c.title, c.created_at, c.updated_at, c.model_id,
                    m.display_name AS model_display_name
             FROM chats c LEFT JOIN ai_models m ON m.id = c.model_id
             WHERE c.uuid = ? AND c.user_id = ?',
            [$uuid, (int) $ctx['user']['id']]
        );
        if (!$chat) {
            Response::error('not_found', 'Chat not found', 404);
        }
        $messages = DB::fetchAll(
            'SELECT id, role, content, created_at, input_tokens, output_tokens, cost_usd
             FROM messages WHERE chat_id = ? ORDER BY id ASC',
            [(int) $chat['id']]
        );
        Response::json(['chat' => self::chatPublic($chat), 'messages' => $messages]);
    }

    /** DELETE /api/chats/{id} */
    public static function deleteChat(array $ctx): void
    {
        $uuid = (string) ($ctx['params']['id'] ?? '');
        DB::execute('DELETE FROM chats WHERE uuid = ? AND user_id = ?', [$uuid, (int) $ctx['user']['id']]);
        Response::json(['ok' => true]);
    }

    /** PATCH /api/chats/{id} - rename. */
    public static function renameChat(array $ctx): void
    {
        $uuid = (string) ($ctx['params']['id'] ?? '');
        $title = trim((string) Request::input('title', ''));
        if ($title === '') {
            Response::error('invalid_input', 'title is required', 422);
        }
        DB::execute(
            'UPDATE chats SET title = ? WHERE uuid = ? AND user_id = ?',
            [mb_substr($title, 0, 200), $uuid, (int) $ctx['user']['id']]
        );
        Response::json(['ok' => true]);
    }

    /**
     * POST /api/chat
     * Body: { model_id, chat_id?, messages: [{role, content}, ...] }
     * chat_id is the UUID (or null for new chat).
     */
    public static function send(array $ctx): void
    {
        $userId    = (int) $ctx['user']['id'];
        $modelId   = (int) Request::input('model_id', 0);
        $chatUuid  = (string) Request::input('chat_id', '');
        $messages  = Request::input('messages', []);

        if (!is_array($messages) || empty($messages)) {
            Response::error('invalid_input', 'messages must be a non-empty array', 422);
        }

        $model = $modelId > 0
            ? DB::fetchOne('SELECT * FROM ai_models WHERE id = ? AND is_active = 1', [$modelId])
            : DB::fetchOne('SELECT * FROM ai_models WHERE is_active = 1 AND is_default = 1 ORDER BY sort_order DESC LIMIT 1');
        if (!$model) {
            $model = DB::fetchOne('SELECT * FROM ai_models WHERE is_active = 1 ORDER BY sort_order DESC LIMIT 1');
        }
        if (!$model) {
            Response::error('no_models', 'No active models configured. Please ask the admin to add one.', 400);
        }

        // Balance check (admins bypass)
        if ((int) $ctx['user']['is_admin'] !== 1) {
            $balanceRow = DB::fetchOne('SELECT balance_usd FROM users WHERE id = ?', [$userId]);
            if ($balanceRow && (float) $balanceRow['balance_usd'] < 0) {
                Response::error('insufficient_balance', 'Your balance is depleted. Please upgrade your plan or top up.', 402);
            }
        }

        // Find or create chat
        $chatRow = null;
        if ($chatUuid !== '') {
            $chatRow = DB::fetchOne(
                'SELECT id, uuid FROM chats WHERE uuid = ? AND user_id = ?',
                [$chatUuid, $userId]
            );
            if (!$chatRow) {
                Response::error('not_found', 'Chat not found', 404);
            }
            $chatId = (int) $chatRow['id'];
        } else {
            $firstUser = '';
            foreach ($messages as $m) {
                if (($m['role'] ?? '') === 'user') {
                    $firstUser = (string) ($m['content'] ?? '');
                    break;
                }
            }
            $title = mb_substr(trim($firstUser), 0, 80);
            if ($title === '') {
                $title = 'New chat';
            }
            $chatUuid = self::uuid();
            $chatId = DB::insert(
                'INSERT INTO chats (uuid, user_id, title, model_id) VALUES (?, ?, ?, ?)',
                [$chatUuid, $userId, $title, (int) $model['id']]
            );
        }

        // Persist last user message
        $lastUser = null;
        for ($i = count($messages) - 1; $i >= 0; $i--) {
            if (($messages[$i]['role'] ?? '') === 'user') {
                $lastUser = $messages[$i];
                break;
            }
        }
        if ($lastUser) {
            DB::insert(
                'INSERT INTO messages (chat_id, role, content, model_id) VALUES (?, "user", ?, ?)',
                [$chatId, (string) $lastUser['content'], (int) $model['id']]
            );
        }

        $started = microtime(true);
        try {
            $reply = Anthropic::complete($model, $messages);
        } catch (\Throwable $e) {
            DB::insert(
                'INSERT INTO usage_logs (user_id, model_id, chat_id, provider, provider_model, input_tokens, output_tokens, cost_usd, latency_ms, status, error_message)
                 VALUES (?, ?, ?, ?, ?, 0, 0, 0, ?, "error", ?)',
                [$userId, (int) $model['id'], $chatId, $model['provider'], $model['provider_model'],
                 (int) ((microtime(true) - $started) * 1000), $e->getMessage()]
            );
            error_log('[zeo] AI error: ' . $e->getMessage());
            Response::error('ai_error', $e->getMessage(), 502);
        }

        $latencyMs = (int) ((microtime(true) - $started) * 1000);

        $inputTokens  = (int) ($reply['usage']['input_tokens']  ?? 0);
        $outputTokens = (int) ($reply['usage']['output_tokens'] ?? 0);
        $cost = ($inputTokens  / 1_000_000) * (float) $model['price_input_per_mtok']
              + ($outputTokens / 1_000_000) * (float) $model['price_output_per_mtok'];

        $assistantText = $reply['text'];
        DB::insert(
            'INSERT INTO messages (chat_id, role, content, model_id, input_tokens, output_tokens, cost_usd)
             VALUES (?, "assistant", ?, ?, ?, ?, ?)',
            [$chatId, $assistantText, (int) $model['id'], $inputTokens, $outputTokens, $cost]
        );

        DB::execute('UPDATE chats SET updated_at = NOW(), model_id = ? WHERE id = ?', [(int) $model['id'], $chatId]);

        DB::insert(
            'INSERT INTO usage_logs (user_id, model_id, chat_id, provider, provider_model, input_tokens, output_tokens, cost_usd, latency_ms, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "success")',
            [$userId, (int) $model['id'], $chatId, $model['provider'], $model['provider_model'],
             $inputTokens, $outputTokens, $cost, $latencyMs]
        );
        if ((int) $ctx['user']['is_admin'] !== 1) {
            DB::execute('UPDATE users SET balance_usd = balance_usd - ? WHERE id = ?', [$cost, $userId]);
            DB::insert(
                'INSERT INTO billing_transactions (user_id, amount_usd, type, description) VALUES (?, ?, "charge", ?)',
                [$userId, -$cost, 'AI usage: ' . $model['display_name']]
            );
        }

        Response::json([
            'chat_id'  => $chatUuid,
            'message'  => [
                'role'    => 'assistant',
                'content' => $assistantText,
            ],
            'usage'    => [
                'input_tokens'  => $inputTokens,
                'output_tokens' => $outputTokens,
                'cost_usd'      => round($cost, 6),
            ],
            'model'    => [
                'id'           => (int) $model['id'],
                'display_name' => $model['display_name'],
                'made_by'      => $model['made_by_label'],
            ],
        ]);
    }

    /** GET /api/billing/me */
    public static function billingMe(array $ctx): void
    {
        $userId = (int) $ctx['user']['id'];
        $balance = DB::fetchOne('SELECT balance_usd FROM users WHERE id = ?', [$userId]);
        $usage = DB::fetchAll(
            'SELECT u.id, u.input_tokens, u.output_tokens, u.cost_usd, u.latency_ms, u.status, u.created_at,
                    m.display_name AS model_display_name
             FROM usage_logs u
             LEFT JOIN ai_models m ON m.id = u.model_id
             WHERE u.user_id = ? ORDER BY u.id DESC LIMIT 100',
            [$userId]
        );
        $totals = DB::fetchOne(
            'SELECT COALESCE(SUM(cost_usd),0) AS spent, COALESCE(SUM(input_tokens),0) AS in_tok, COALESCE(SUM(output_tokens),0) AS out_tok
             FROM usage_logs WHERE user_id = ?',
            [$userId]
        );
        $sub = DB::fetchOne(
            'SELECT s.id, s.status, s.started_at, s.current_period_end, p.slug, p.name, p.price_usd, p.interval
             FROM user_subscriptions s
             INNER JOIN subscription_plans p ON p.id = s.plan_id
             WHERE s.user_id = ? AND s.status = "active"
             ORDER BY s.id DESC LIMIT 1',
            [$userId]
        );
        Response::json([
            'balance_usd'  => (float) ($balance['balance_usd'] ?? 0),
            'totals'       => $totals,
            'recent'       => $usage,
            'subscription' => $sub,
        ]);
    }
}
