<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Http\Request;

class Authenticate
{
    public function __construct(private AuthFactory $auth)
    {
    }

    public function handle(Request $request, Closure $next, ...$guards)
    {
        $guards = empty($guards) ? [null] : $guards;

        foreach ($guards as $guard) {
            if ($this->auth->guard($guard)->check()) {
                return $next($request);
            }
        }

        throw new AuthenticationException('Unauthenticated.', $guards);
    }
}
