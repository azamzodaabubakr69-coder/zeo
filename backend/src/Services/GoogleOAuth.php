<?php
declare(strict_types=1);

namespace Zekron\Services;

use Zekron\Support\Env;

final class GoogleOAuth
{
    public static function buildAuthUrl(string $state): string
    {
        $params = [
            'client_id'     => Env::getRequired('GOOGLE_CLIENT_ID'),
            'redirect_uri'  => Env::getRequired('GOOGLE_REDIRECT_URI'),
            'response_type' => 'code',
            'scope'         => 'openid email profile',
            'access_type'   => 'online',
            'prompt'        => 'select_account',
            'state'         => $state,
        ];
        return 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($params);
    }

    /** @return array{sub:string,email:string,name:string,picture:string} */
    public static function exchangeCodeForProfile(string $code): array
    {
        $tokenResponse = self::http('POST', 'https://oauth2.googleapis.com/token', [
            'code'          => $code,
            'client_id'     => Env::getRequired('GOOGLE_CLIENT_ID'),
            'client_secret' => Env::getRequired('GOOGLE_CLIENT_SECRET'),
            'redirect_uri'  => Env::getRequired('GOOGLE_REDIRECT_URI'),
            'grant_type'    => 'authorization_code',
        ]);

        if (empty($tokenResponse['access_token'])) {
            throw new \RuntimeException('Google token exchange failed: ' . json_encode($tokenResponse));
        }

        $profile = self::http('GET',
            'https://openidconnect.googleapis.com/v1/userinfo',
            null,
            ['Authorization: Bearer ' . $tokenResponse['access_token']]
        );

        return [
            'sub'     => (string) ($profile['sub'] ?? ''),
            'email'   => (string) ($profile['email'] ?? ''),
            'name'    => (string) ($profile['name'] ?? ''),
            'picture' => (string) ($profile['picture'] ?? ''),
        ];
    }

    /** @return array<string,mixed> */
    private static function http(string $method, string $url, ?array $form = null, array $headers = []): array
    {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_CUSTOMREQUEST  => $method,
            CURLOPT_HTTPHEADER     => $headers,
        ]);
        if ($form !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($form));
        }
        $body = curl_exec($ch);
        $err  = curl_error($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);
        if ($body === false) {
            throw new \RuntimeException('Google HTTP error: ' . $err);
        }
        $data = json_decode((string) $body, true);
        if (!is_array($data)) {
            throw new \RuntimeException('Invalid Google response (status ' . $code . '): ' . substr((string) $body, 0, 500));
        }
        if ($code >= 400) {
            throw new \RuntimeException('Google API error (' . $code . '): ' . json_encode($data));
        }
        return $data;
    }
}
