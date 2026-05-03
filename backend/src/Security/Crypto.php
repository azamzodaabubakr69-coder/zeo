<?php
declare(strict_types=1);

namespace Zekron\Security;

use Zekron\Support\Env;

/**
 * AES-256-GCM encryption helper for at-rest secrets (provider API keys).
 */
final class Crypto
{
    private static function key(): string
    {
        $appKey = Env::getRequired('APP_KEY');
        return hash('sha256', $appKey, true); // 32 bytes
    }

    public static function encrypt(string $plain): string
    {
        $iv = random_bytes(12);
        $tag = '';
        $cipher = openssl_encrypt(
            $plain,
            'aes-256-gcm',
            self::key(),
            OPENSSL_RAW_DATA,
            $iv,
            $tag
        );
        if ($cipher === false) {
            throw new \RuntimeException('Encryption failed');
        }
        return base64_encode($iv . $tag . $cipher);
    }

    public static function decrypt(string $payload): string
    {
        $bin = base64_decode($payload, true);
        if ($bin === false || strlen($bin) < 12 + 16) {
            throw new \RuntimeException('Invalid ciphertext');
        }
        $iv = substr($bin, 0, 12);
        $tag = substr($bin, 12, 16);
        $cipher = substr($bin, 28);
        $plain = openssl_decrypt(
            $cipher,
            'aes-256-gcm',
            self::key(),
            OPENSSL_RAW_DATA,
            $iv,
            $tag
        );
        if ($plain === false) {
            throw new \RuntimeException('Decryption failed');
        }
        return $plain;
    }
}
