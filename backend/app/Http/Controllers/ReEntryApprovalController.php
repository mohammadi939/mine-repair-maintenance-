<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReEntryApprovalRequest;
use App\Models\ReEntryApproval;
use App\Services\TimelineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReEntryApprovalController extends Controller
{
    public function __construct(private TimelineService $timelineService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = ReEntryApproval::with(['repairOrder.exitRequest.equipment', 'approver'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        return response()->json($query->paginate(15));
    }

    public function store(ReEntryApprovalRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['approved_by'] = auth()->id();
        $data['approved_at'] = $data['approved_at'] ?? now();

        $approval = ReEntryApproval::create($data);

        $this->timelineService->record(
            $approval->repairOrder->exitRequest->equipment_id,
            'reentry_checked',
            __('بازگشت تجهیز بررسی شد'),
            $approval->inspection_notes,
            ['reentry_approval_id' => $approval->id]
        );

        return response()->json($approval->load(['repairOrder.exitRequest.equipment', 'approver']), 201);
    }
}
