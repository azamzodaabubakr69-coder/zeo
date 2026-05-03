<?php
declare(strict_types=1);

namespace Zekron\Services;

use Zekron\Database\DB;
use Zekron\Security\Crypto;
use Zekron\Support\Env;

/**
 * Minimal Anthropic Messages API client.
 * https://docs.anthropic.com/en/api/messages
 */
final class Anthropic
{
    /**
     * @param array $model row from ai_models
     * @param array<int,array{role:string,content:mixed}> $messages
     * @return array{text:string, usage:array{input_tokens:int,output_tokens:int}}
     */
    public static function complete(array $model, array $messages): array
    {
        $apiKey = self::resolveApiKey($model['provider'] ?? 'anthropic');
        if (!$apiKey) {
            throw new \RuntimeException('No active API key configured for provider ' . ($model['provider'] ?? 'anthropic') . '. Ask admin to add one.');
        }

        // Anthropic expects "system" separately, and only role=user|assistant in messages.
        $systemParts = [];
        if (!empty($model['system_prompt'])) {
            $systemParts[] = (string) $model['system_prompt'];
        }
        $cleanMessages = [];
        foreach ($messages as $m) {
            $role = (string) ($m['role'] ?? '');
            $content = $m['content'] ?? '';
            if ($role === 'system') {
                $systemParts[] = is_string($content) ? $content : json_encode($content);
                continue;
            }
            if (!in_array($role, ['user', 'assistant'], true)) {
                continue;
            }
            $cleanMessages[] = [
                'role'    => $role,
                'content' => is_string($content) ? $content : json_encode($content, JSON_UNESCAPED_UNICODE),
            ];
        }
        if (empty($cleanMessages)) {
            throw new \RuntimeException('No user/assistant messages to send');
        }

        $payload = [
            'model'       => (string) $model['provider_model'],
            'max_tokens'  => max(256, (int) $model['max_output_tokens']),
            'messages'    => $cleanMessages,
        ];
        if (!empty($systemParts)) {
            $payload['system'] = implode("\n\n", $systemParts);
        }

        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => 'https://api.anthropic.com/v1/messages',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $body,
            CURLOPT_TIMEOUT        => 120,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'x-api-key: ' . $apiKey,
                'anthropic-version: 2023-06-01',
            ],
        ]);
        $resp = curl_exec($ch);
        $err  = curl_error($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);

        if ($resp === false) {
            throw new \RuntimeException('Anthropic HTTP error: ' . $err);
        }
        $data = json_decode((string) $resp, true);
        if (!is_array($data)) {
            throw new \RuntimeException('Invalid Anthropic response (status ' . $code . ')');
        }
        if ($code >= 400) {
            $msg = $data['error']['message'] ?? ('Anthropic error ' . $code);
            throw new \RuntimeException((string) $msg);
        }

        $text = '';
        foreach (($data['content'] ?? []) as $part) {
            if (($part['type'] ?? '') === 'text') {
                $text .= (string) ($part['text'] ?? '');
            }
        }

        return [
            'text'  => $text,
            'usage' => [
                'input_tokens'  => (int) ($data['usage']['input_tokens']  ?? 0),
                'output_tokens' => (int) ($data['usage']['output_tokens'] ?? 0),
            ],
        ];
    }

    private static function resolveApiKey(string $provider): ?string
    {
        $row = DB::fetchOne(
            'SELECT id, key_encrypted FROM api_keys
             WHERE provider = ? AND is_active = 1
             ORDER BY priority DESC, id DESC LIMIT 1',
            [$provider]
        );
        if ($row) {
            try {
                $key = Crypto::decrypt((string) $row['key_encrypted']);
                DB::execute('UPDATE api_keys SET last_used_at = NOW() WHERE id = ?', [(int) $row['id']]);
                return $key;
            } catch (\Throwable $e) {
                error_log('[zekron] Could not decrypt api_keys row #' . $row['id'] . ': ' . $e->getMessage());
            }
        }
        // Env fallback (only for anthropic)
        if ($provider === 'anthropic') {
            $env = Env::get('ANTHROPIC_API_KEY');
            return $env ?: null;
        }
        return null;
    }
}
