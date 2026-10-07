<?php

use App\Http\Middleware\EnsureUserIsAdmin;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        /*
         * Railway and hosts like it terminate TLS at their edge and forward
         * the request to the container over plain HTTP, leaving the real
         * scheme in X-Forwarded-Proto. Without a trusted proxy Laravel
         * ignores that header and generates http:// asset URLs on an https://
         * page, which the browser then blocks as mixed content.
         *
         * '*' because the platform's edge IP is not fixed, and the container
         * is only reachable through it.
         */
        $middleware->trustProxies(at: '*');

        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // No raw stack trace should ever reach the React frontend.
        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->is('api/*') && ! $request->expectsJson()) {
                return null;
            }

            // Validation and auth failures already have good default shapes.
            if ($e instanceof ValidationException) {
                return null;
            }

            if ($e instanceof AuthenticationException) {
                return response()->json(['message' => 'Please sign in to continue.'], 401);
            }

            if ($e instanceof AuthorizationException) {
                return response()->json([
                    'message' => $e->getMessage() ?: 'You are not allowed to do that.',
                ], 403);
            }
            
            if ($e instanceof ModelNotFoundException
                || ($e instanceof NotFoundHttpException && $e->getPrevious() instanceof ModelNotFoundException)) {
                return response()->json(['message' => 'The requested item could not be found.'], 404);
            }

            if ($e instanceof HttpExceptionInterface) {
                return response()->json([
                    'message' => $e->getMessage() ?: 'The request could not be completed.',
                ], $e->getStatusCode());
            }

            report($e);

            return response()->json([
                'message' => 'Something went wrong on our end. Please try again.',
                'detail' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        });
    })->create();
