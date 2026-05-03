<?php
declare(strict_types=1);

namespace Zekron\Http;

final class Router
{
    /** @var array<int, array{method:string, pattern:string, regex:string, params:array<int,string>, handler:callable, middleware:array<int,callable>}> */
    private array $routes = [];

    public function get(string $pattern, callable $handler, array $middleware = []): void    { $this->add('GET',    $pattern, $handler, $middleware); }
    public function post(string $pattern, callable $handler, array $middleware = []): void   { $this->add('POST',   $pattern, $handler, $middleware); }
    public function put(string $pattern, callable $handler, array $middleware = []): void    { $this->add('PUT',    $pattern, $handler, $middleware); }
    public function patch(string $pattern, callable $handler, array $middleware = []): void  { $this->add('PATCH',  $pattern, $handler, $middleware); }
    public function delete(string $pattern, callable $handler, array $middleware = []): void { $this->add('DELETE', $pattern, $handler, $middleware); }

    private function add(string $method, string $pattern, callable $handler, array $middleware): void
    {
        $params = [];
        $regex = preg_replace_callback(
            '#\{([a-zA-Z_][a-zA-Z0-9_]*)\}#',
            static function ($m) use (&$params) {
                $params[] = $m[1];
                return '([^/]+)';
            },
            $pattern
        );
        $this->routes[] = [
            'method'     => $method,
            'pattern'    => $pattern,
            'regex'      => '#^' . $regex . '$#',
            'params'     => $params,
            'handler'    => $handler,
            'middleware' => $middleware,
        ];
    }

    public function dispatch(string $method, string $path): void
    {
        $path = '/' . ltrim($path, '/');
        // Strip trailing slash except for root
        if ($path !== '/' && str_ends_with($path, '/')) {
            $path = rtrim($path, '/');
        }

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }
            if (!preg_match($route['regex'], $path, $matches)) {
                continue;
            }
            array_shift($matches);
            $params = array_combine($route['params'], $matches) ?: [];

            // Run middleware. Each middleware is `function (array $params): array $context`.
            $context = ['params' => $params];
            foreach ($route['middleware'] as $mw) {
                $extra = $mw($context);
                if (is_array($extra)) {
                    $context = array_merge($context, $extra);
                }
            }

            ($route['handler'])($context);
            return;
        }

        Response::error('not_found', 'Route not found: ' . $method . ' ' . $path, 404);
    }
}
