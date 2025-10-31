<?php

namespace App\Http\Controllers;

use App\Http\Requests\RepairOrderStoreRequest;
use App\Models\RepairOrder;
use App\Services\TimelineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RepairOrderController extends Controller
{
    public function __construct(private TimelineService $timelineService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = RepairOrder::with(['exitRequest.equipment', 'assignee', 'reEntryApproval'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('unit_id')) {
            $query->whereHas('exitRequest.equipment', fn($q) => $q->where('unit_id', $request->integer('unit_id')));
        }

        return response()->json($query->paginate(15));
    }

    public function store(RepairOrderStoreRequest $request): JsonResponse
    {
        $data = $request->validated();
        $order = RepairOrder::create($data);

        $this->timelineService->record(
            $order->exitRequest->equipment_id,
            'repair_started',
            __('فرایند تعمیر آغاز شد'),
            '',
            ['repair_order_id' => $order->id]
        );

        return response()->json($order->load(['exitRequest.equipment', 'assignee']), 201);
    }

    public function update(Request $request, RepairOrder $repairOrder): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', 'in:pending,in_progress,completed,returned'],
            'actions' => ['array'],
            'materials' => ['array'],
            'completed_at' => ['nullable', 'date', 'after_or_equal:started_at'],
        ]);

        $repairOrder->update($data);

        $this->timelineService->record(
            $repairOrder->exitRequest->equipment_id,
            'repair_updated',
            __('وضعیت تعمیر بروزرسانی شد'),
            '',
            ['repair_order_id' => $repairOrder->id, 'status' => $repairOrder->status]
        );

        return response()->json($repairOrder->fresh());
    }
}
