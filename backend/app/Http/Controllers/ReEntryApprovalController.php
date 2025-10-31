<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\HandlesPagination;
use App\Http\Requests\ReEntryApprovalRequest;
use App\Models\ReEntryApproval;
use App\Services\TimelineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ReEntryApprovalController extends Controller
{
    use HandlesPagination;

    public function __construct(private TimelineService $timelineService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = ReEntryApproval::with(['repairOrder.exitRequest.equipment', 'approver'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        return response()->json($query->paginate($this->resolvePerPage($request)));
    }

    public function store(ReEntryApprovalRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['approved_by'] = auth()->id();
        $data['approved_at'] = $data['approved_at'] ? Carbon::parse($data['approved_at']) : now();

        $approval = ReEntryApproval::create($data)->load(['repairOrder.exitRequest', 'approver']);

        $repairOrder = $approval->repairOrder;
        $exitRequest = $repairOrder?->exitRequest;

        if ($repairOrder && $approval->status === 'approved') {
            $repairOrder->update(array_filter([
                'status' => 'returned',
                'completed_at' => $repairOrder->completed_at ?? $approval->approved_at,
            ]));

            if ($exitRequest) {
                $exitRequest->update(array_filter([
                    'status' => 'completed',
                    'approved_at' => $exitRequest->approved_at ?? $approval->approved_at,
                ]));
            }
        }

        $equipmentId = $exitRequest?->equipment_id;

        if ($equipmentId) {
            $statusLabel = match ($approval->status) {
                'approved' => __('تایید شد'),
                'rejected' => __('رد شد'),
                default => __('در انتظار بررسی'),
            };

            $this->timelineService->record(
                $equipmentId,
                $approval->status === 'approved' ? 'reentry_confirmed' : 'reentry_checked',
                __('بازگشت تجهیز بررسی شد - وضعیت: :status', ['status' => $statusLabel]),
                $approval->inspection_notes,
                [
                    'reentry_approval_id' => $approval->id,
                    'status' => $approval->status,
                ]
            );
        }

        return response()->json($approval->load(['repairOrder.exitRequest.equipment', 'approver']), 201);
    }
}
