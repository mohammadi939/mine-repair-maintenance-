<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $user = Auth::user();

        if (!$user || (count($roles) && !in_array($user->role, $roles))) {
            throw new AccessDeniedHttpException(__('دسترسی غیرمجاز'));
        }

        return $next($request);
    }
}
