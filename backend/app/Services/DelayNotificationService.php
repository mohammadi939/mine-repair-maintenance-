<?php

namespace App\Services;

use App\Models\DelayNotification;
use Illuminate\Support\Facades\Log;

class DelayNotificationService
{
    public function notifyDelay(array $attributes): DelayNotification
    {
        $notification = DelayNotification::create(array_merge([
            'status' => 'pending',
            'expected_at' => now(),
        ], $attributes));

        Log::warning('Delay notification generated', [
            'id' => $notification->id,
            'equipment_id' => $notification->equipment_id,
            'message' => $notification->message,
        ]);

        return $notification;
    }
}
