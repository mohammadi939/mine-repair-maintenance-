<?php

namespace App\Http\Controllers;

use App\Http\Requests\ExitRequestStoreRequest;
use App\Models\ExitRequest;
use App\Services\DelayNotificationService;
use App\Services\TimelineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExitRequestController extends Controller
{
    public function __construct(
        private TimelineService $timelineService,
        private DelayNotificationService $delayNotificationService
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $query = ExitRequest::with(['equipment', 'requester', 'repairOrder'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('unit_id')) {
            $query->whereHas('equipment', fn($q) => $q->where('unit_id', $request->integer('unit_id')));
        }

        return response()->json($query->paginate(15));
    }

    public function store(ExitRequestStoreRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['requested_by'] = auth()->id();
        $data['status'] = 'pending';

        $exit = ExitRequest::create($data);

        $this->timelineService->record(
            $exit->equipment_id,
            'exit_requested',
            __('درخواست خروج ثبت شد'),
            $exit->reason,
            ['exit_request_id' => $exit->id]
        );

        if ($exit->expected_return_at && now()->diffInHours($exit->expected_return_at, false) < 0) {
            $this->delayNotificationService->notifyDelay([
                'equipment_id' => $exit->equipment_id,
                'related_type' => ExitRequest::class,
                'related_id' => $exit->id,
                'message' => __('تأخیر در بازگشت تجهیز'),
                'expected_at' => $exit->expected_return_at,
            ]);
        }

        return response()->json($exit->load(['equipment', 'requester']), 201);
    }

    public function approve(Request $request, ExitRequest $exitRequest): JsonResponse
    {
        $exitRequest->update([
            'status' => 'approved',
            'approved_at' => now(),
        ]);

        $this->timelineService->record(
            $exitRequest->equipment_id,
            'exit_approved',
            __('درخواست خروج تایید شد'),
            '',
            ['exit_request_id' => $exitRequest->id]
        );

        return response()->json($exitRequest->fresh());
    }

    public function reject(Request $request, ExitRequest $exitRequest): JsonResponse
    {
        $exitRequest->update([
            'status' => 'rejected',
        ]);

        $this->timelineService->record(
            $exitRequest->equipment_id,
            'exit_rejected',
            __('درخواست خروج رد شد'),
            $request->input('reason', ''),
            ['exit_request_id' => $exitRequest->id]
        );

        return response()->json($exitRequest->fresh());
    }
}
