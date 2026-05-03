<?php
declare(strict_types=1);

namespace Zekron\Controllers;

use Zekron\Database\DB;
use Zekron\Http\Request;
use Zekron\Http\Response;

final class PlanController
{
    public static function publicView(array $row): array
    {
        $features = [];
        if (!empty($row['features_json'])) {
            $decoded = is_array($row['features_json'])
                ? $row['features_json']
                : json_decode((string) $row['features_json'], true);
            if (is_array($decoded)) {
                $features = $decoded;
            }
        }
        return [
            'id'                  => (int) $row['id'],
            'slug'                => $row['slug'],
            'name'                => $row['name'],
            'description'         => $row['description'],
            'price_usd'           => (float) $row['price_usd'],
            'interval'            => $row['interval'],
            'monthly_credit_usd'  => (float) $row['monthly_credit_usd'],
            'monthly_message_cap' => (int)   $row['monthly_message_cap'],
            'features'            => $features,
            'is_active'           => (bool) $row['is_active'],
            'is_featured'         => (bool) $row['is_featured'],
            'sort_order'          => (int) $row['sort_order'],
        ];
    }

    /** GET /api/plans (public) */
    public static function listPublic(array $ctx): void
    {
        $rows = DB::fetchAll(
            'SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY sort_order ASC, id ASC'
        );
        Response::json(['plans' => array_map([self::class, 'publicView'], $rows)]);
    }

    /** POST /api/plans/subscribe { plan_id }  - simulated subscribe (admin runs real billing) */
    public static function subscribe(array $ctx): void
    {
        $userId = (int) $ctx['user']['id'];
        $planId = (int) Request::input('plan_id', 0);
        if ($planId <= 0) {
            Response::error('invalid_input', 'plan_id required', 422);
        }
        $plan = DB::fetchOne('SELECT * FROM subscription_plans WHERE id = ? AND is_active = 1', [$planId]);
        if (!$plan) {
            Response::error('not_found', 'Plan not found', 404);
        }

        // Cancel any existing active subscription
        DB::execute(
            'UPDATE user_subscriptions SET status = "canceled", canceled_at = NOW() WHERE user_id = ? AND status = "active"',
            [$userId]
        );

        $periodEnd = $plan['interval'] === 'year'
            ? 'DATE_ADD(NOW(), INTERVAL 1 YEAR)'
            : ($plan['interval'] === 'one_time' ? 'NULL' : 'DATE_ADD(NOW(), INTERVAL 1 MONTH)');

        DB::insert(
            "INSERT INTO user_subscriptions (user_id, plan_id, status, started_at, current_period_end)
             VALUES (?, ?, 'active', NOW(), {$periodEnd})",
            [$userId, $planId]
        );

        // Credit the user with the plan's monthly_credit_usd
        if ((float) $plan['monthly_credit_usd'] > 0) {
            DB::execute(
                'UPDATE users SET balance_usd = balance_usd + ? WHERE id = ?',
                [(float) $plan['monthly_credit_usd'], $userId]
            );
            DB::insert(
                'INSERT INTO billing_transactions (user_id, amount_usd, type, description) VALUES (?, ?, "subscription", ?)',
                [$userId, (float) $plan['monthly_credit_usd'], 'Subscription credit: ' . $plan['name']]
            );
        }

        Response::json(['ok' => true, 'plan' => self::publicView($plan)]);
    }

    /** POST /api/plans/cancel */
    public static function cancel(array $ctx): void
    {
        $userId = (int) $ctx['user']['id'];
        DB::execute(
            'UPDATE user_subscriptions SET status = "canceled", canceled_at = NOW() WHERE user_id = ? AND status = "active"',
            [$userId]
        );
        Response::json(['ok' => true]);
    }

    // -------- Admin --------

    public static function adminList(array $ctx): void
    {
        $rows = DB::fetchAll('SELECT * FROM subscription_plans ORDER BY sort_order ASC, id ASC');
        Response::json(['plans' => array_map([self::class, 'publicView'], $rows)]);
    }

    public static function adminCreate(array $ctx): void
    {
        $b = Request::json();
        foreach (['slug', 'name'] as $k) {
            if (empty($b[$k])) {
                Response::error('missing_field', "Field {$k} is required", 422);
            }
        }
        $features = $b['features'] ?? [];
        if (!is_array($features)) {
            $features = [];
        }
        $id = DB::insert(
            'INSERT INTO subscription_plans
              (slug, name, description, price_usd, `interval`,
               monthly_credit_usd, monthly_message_cap, features_json,
               is_active, is_featured, sort_order)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)',
            [
                $b['slug'],
                $b['name'],
                $b['description'] ?? null,
                (float) ($b['price_usd'] ?? 0),
                in_array(($b['interval'] ?? 'month'), ['month','year','one_time'], true) ? $b['interval'] : 'month',
                (float) ($b['monthly_credit_usd'] ?? 0),
                (int)   ($b['monthly_message_cap'] ?? 0),
                json_encode(array_values($features), JSON_UNESCAPED_UNICODE),
                array_key_exists('is_active', $b) ? (!empty($b['is_active']) ? 1 : 0) : 1,
                !empty($b['is_featured']) ? 1 : 0,
                (int) ($b['sort_order'] ?? 0),
            ]
        );
        $row = DB::fetchOne('SELECT * FROM subscription_plans WHERE id = ?', [$id]);
        Response::json(['plan' => self::publicView($row)], 201);
    }

    public static function adminUpdate(array $ctx): void
    {
        $id = (int) ($ctx['params']['id'] ?? 0);
        $row = DB::fetchOne('SELECT * FROM subscription_plans WHERE id = ?', [$id]);
        if (!$row) {
            Response::error('not_found', 'Plan not found', 404);
        }
        $b = Request::json();
        $allowed = ['slug','name','description','price_usd','interval',
                    'monthly_credit_usd','monthly_message_cap',
                    'is_active','is_featured','sort_order'];
        $fields = []; $params = [];
        foreach ($allowed as $k) {
            if (!array_key_exists($k, $b)) continue;
            $val = $b[$k];
            if (in_array($k, ['is_active','is_featured'], true)) $val = !empty($val) ? 1 : 0;
            $fields[] = "`{$k}` = ?";
            $params[] = $val;
        }
        if (array_key_exists('features', $b) && is_array($b['features'])) {
            $fields[] = '`features_json` = ?';
            $params[] = json_encode(array_values($b['features']), JSON_UNESCAPED_UNICODE);
        }
        if (empty($fields)) {
            Response::json(['plan' => self::publicView($row)]);
        }
        $params[] = $id;
        DB::execute('UPDATE subscription_plans SET ' . implode(', ', $fields) . ' WHERE id = ?', $params);
        $row = DB::fetchOne('SELECT * FROM subscription_plans WHERE id = ?', [$id]);
        Response::json(['plan' => self::publicView($row)]);
    }

    public static function adminDelete(array $ctx): void
    {
        $id = (int) ($ctx['params']['id'] ?? 0);
        DB::execute('DELETE FROM subscription_plans WHERE id = ?', [$id]);
        Response::json(['ok' => true]);
    }
}
