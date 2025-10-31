<?php

namespace App\Http\Controllers;

use App\Models\DelayNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DelayNotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DelayNotification::with('equipment')->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        return response()->json($query->paginate(15));
    }

    public function markSent(DelayNotification $notification): JsonResponse
    {
        $notification->update([
            'status' => 'sent',
            'sent_at' => now(),
        ]);

        return response()->json($notification);
    }
}
