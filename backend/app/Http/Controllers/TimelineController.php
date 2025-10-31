<?php

namespace App\Http\Controllers;

use App\Models\TimelineEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TimelineController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'equipment_id' => ['required', 'integer', 'exists:equipments,id'],
        ]);

        $events = TimelineEvent::with('user')
            ->where('equipment_id', $request->integer('equipment_id'))
            ->latest('occurred_at')
            ->paginate(20);

        return response()->json($events);
    }
}
