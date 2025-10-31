<?php

namespace App\Services;

use App\Models\TimelineEvent;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class TimelineService
{
    public function record(int $equipmentId, string $eventType, string $title, string $description = '', array $context = []): TimelineEvent
    {
        $event = TimelineEvent::create([
            'equipment_id' => $equipmentId,
            'event_type' => $eventType,
            'title' => $title,
            'description' => $description,
            'recorded_by' => optional(Auth::user())->id,
            'occurred_at' => now(),
            'context' => $context,
        ]);

        Log::info('Timeline event recorded', [
            'event_id' => $event->id,
            'type' => $eventType,
            'title' => $title,
            'context' => $context,
        ]);

        return $event;
    }
}
