<?php
declare(strict_types=1);

namespace Zekron\Controllers;

use Zekron\Database\DB;
use Zekron\Http\Response;

final class ModelController
{
    /** Public-safe view of a model row (no provider_model leaked unless requested). */
    public static function publicView(array $row, bool $includeProviderModel = false): array
    {
        $out = [
            'id'                  => (int) $row['id'],
            'slug'                => $row['slug'],
            'display_name'        => $row['display_name'],
            'description'         => $row['description'],
            'made_by_label'       => $row['made_by_label'],
            'made_by_logo_svg'    => $row['made_by_logo_svg'],
            'logo_svg'            => $row['logo_svg'],
            'price_input_per_mtok'  => (float) $row['price_input_per_mtok'],
            'price_output_per_mtok' => (float) $row['price_output_per_mtok'],
            'max_output_tokens'   => (int) $row['max_output_tokens'],
            'context_window'      => (int) $row['context_window'],
            'supports_thinking'   => (bool) $row['supports_thinking'],
            'supports_vision'     => (bool) $row['supports_vision'],
            'is_default'          => (bool) $row['is_default'],
            'is_active'           => (bool) $row['is_active'],
            'sort_order'          => (int) $row['sort_order'],
        ];
        if ($includeProviderModel) {
            $out['provider'] = $row['provider'];
            $out['provider_model'] = $row['provider_model'];
            $out['system_prompt'] = $row['system_prompt'];
        }
        return $out;
    }

    /** GET /api/models - list active models for end users. */
    public static function listPublic(array $ctx): void
    {
        $rows = DB::fetchAll(
            'SELECT * FROM ai_models WHERE is_active = 1 ORDER BY sort_order DESC, id ASC'
        );
        Response::json([
            'models' => array_map(fn($r) => self::publicView($r, false), $rows),
        ]);
    }
}
