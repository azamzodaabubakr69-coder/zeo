<?php
declare(strict_types=1);

/** @var \Zekron\Http\Router $router */

use Zekron\Controllers\AdminController;
use Zekron\Controllers\AuthController;
use Zekron\Controllers\ChatController;
use Zekron\Controllers\ModelController;
use Zekron\Controllers\PlanController;
use Zekron\Http\Middleware;
use Zekron\Http\Response;

// Health check
$router->get('/', static function (): void {
    Response::json(['ok' => true, 'service' => 'zeo-backend', 'version' => '1.0.0']);
});
$router->get('/api/health', static function (): void {
    Response::json(['ok' => true]);
});

// ---- Auth ----
$router->post('/api/auth/register',         [AuthController::class, 'register']);
$router->post('/api/auth/login',            [AuthController::class, 'login']);
$router->post('/api/auth/logout',           [AuthController::class, 'logout'], [Middleware::auth()]);
$router->get ('/api/auth/me',               [AuthController::class, 'me'],     [Middleware::auth()]);
$router->get ('/api/auth/google',           [AuthController::class, 'googleStart']);
$router->get ('/api/auth/google/callback',  [AuthController::class, 'googleCallback']);

// ---- Models ----
$router->get('/api/models', [ModelController::class, 'listPublic'], [Middleware::auth()]);

// ---- Plans (public list, authed subscribe) ----
$router->get ('/api/plans',           [PlanController::class, 'listPublic']);
$router->post('/api/plans/subscribe', [PlanController::class, 'subscribe'], [Middleware::auth()]);
$router->post('/api/plans/cancel',    [PlanController::class, 'cancel'],    [Middleware::auth()]);

// ---- Chat ----
$router->get   ('/api/chats',          [ChatController::class, 'listChats'],  [Middleware::auth()]);
$router->post  ('/api/chats',          [ChatController::class, 'createChat'], [Middleware::auth()]);
$router->get   ('/api/chats/{id}',     [ChatController::class, 'getChat'],    [Middleware::auth()]);
$router->patch ('/api/chats/{id}',     [ChatController::class, 'renameChat'], [Middleware::auth()]);
$router->delete('/api/chats/{id}',     [ChatController::class, 'deleteChat'], [Middleware::auth()]);
$router->post  ('/api/chat',           [ChatController::class, 'send'],       [Middleware::auth()]);

// ---- Billing (self-service) ----
$router->get('/api/billing/me', [ChatController::class, 'billingMe'], [Middleware::auth()]);

// ---- Admin ----
$admin = [Middleware::admin()];
$router->get   ('/api/admin/stats',          [AdminController::class, 'stats'],         $admin);

$router->get   ('/api/admin/users',          [AdminController::class, 'listUsers'],     $admin);
$router->patch ('/api/admin/users/{id}',     [AdminController::class, 'updateUser'],    $admin);
$router->delete('/api/admin/users/{id}',     [AdminController::class, 'deleteUser'],    $admin);

$router->get   ('/api/admin/models',         [AdminController::class, 'listModels'],    $admin);
$router->post  ('/api/admin/models',         [AdminController::class, 'createModel'],   $admin);
$router->patch ('/api/admin/models/{id}',    [AdminController::class, 'updateModel'],   $admin);
$router->delete('/api/admin/models/{id}',    [AdminController::class, 'deleteModel'],   $admin);

$router->get   ('/api/admin/api-keys',       [AdminController::class, 'listApiKeys'],   $admin);
$router->post  ('/api/admin/api-keys',       [AdminController::class, 'createApiKey'],  $admin);
$router->patch ('/api/admin/api-keys/{id}',  [AdminController::class, 'updateApiKey'],  $admin);
$router->delete('/api/admin/api-keys/{id}',  [AdminController::class, 'deleteApiKey'],  $admin);

$router->get   ('/api/admin/plans',          [PlanController::class, 'adminList'],      $admin);
$router->post  ('/api/admin/plans',          [PlanController::class, 'adminCreate'],    $admin);
$router->patch ('/api/admin/plans/{id}',     [PlanController::class, 'adminUpdate'],    $admin);
$router->delete('/api/admin/plans/{id}',     [PlanController::class, 'adminDelete'],    $admin);

$router->get   ('/api/admin/usage-logs',     [AdminController::class, 'usageLogs'],     $admin);
$router->post  ('/api/admin/billing/topup',  [AdminController::class, 'topup'],         $admin);

$router->get   ('/api/admin/settings',       [AdminController::class, 'listSettings'],  $admin);
$router->post  ('/api/admin/settings',       [AdminController::class, 'setSetting'],    $admin);
