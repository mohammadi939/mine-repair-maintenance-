<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\HandlesPagination;
use App\Models\TimelineEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TimelineController extends Controller
{
    use HandlesPagination;

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'equipment_id' => ['required', 'integer', 'exists:equipments,id'],
        ]);

        $events = TimelineEvent::with('user')
            ->where('equipment_id', $request->integer('equipment_id'))
            ->latest('occurred_at')
            ->paginate($this->resolvePerPage($request, 20));

        return response()->json($events);
    }
}
