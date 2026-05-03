<?php
declare(strict_types=1);

/**
 * Zekron Agent Backend - front controller
 *
 * All HTTP requests hit this file. It loads the environment, autoloader
 * and dispatches to the Router.
 */

// Make sure errors don't leak into the JSON response in production.
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

require __DIR__ . '/../src/bootstrap.php';

use Zekron\Http\Router;
use Zekron\Http\Cors;
use Zekron\Http\Response;

try {
    Cors::handle();

    $router = new Router();
    require __DIR__ . '/../src/routes.php'; // populates $router

    $router->dispatch(
        $_SERVER['REQUEST_METHOD'] ?? 'GET',
        parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/'
    );
} catch (\Throwable $e) {
    error_log('[zekron] Unhandled: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    Response::json([
        'error' => 'internal_error',
        'message' => (getenv('APP_DEBUG') === '1') ? $e->getMessage() : 'Internal server error',
    ], 500);
}
