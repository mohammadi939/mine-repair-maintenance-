<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\HandlesPagination;
use App\Http\Requests\FailureReportRequest;
use App\Models\FailureReport;
use App\Services\TimelineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FailureReportController extends Controller
{
    use HandlesPagination;

    public function __construct(private TimelineService $timelineService)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = FailureReport::with(['equipment', 'reporter'])->latest();

        if ($request->filled('equipment_id')) {
            $query->where('equipment_id', $request->integer('equipment_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('severity')) {
            $query->where('severity', $request->input('severity'));
        }

        return response()->json($query->paginate($this->resolvePerPage($request)));
    }

    public function store(FailureReportRequest $request): JsonResponse
    {
        $payload = $request->validated();
        $payload['reported_by'] = auth()->id();
        $payload['reported_at'] = $payload['reported_at'] ?? now();
        $payload['status'] = 'open';

        $report = FailureReport::create($payload);

        $this->timelineService->record(
            $report->equipment_id,
            'failure_reported',
            __('خرابی گزارش شد'),
            $report->description,
            ['severity' => $report->severity, 'report_id' => $report->id]
        );

        return response()->json($report->load(['equipment', 'reporter']), 201);
    }

    public function update(Request $request, FailureReport $failureReport): JsonResponse
    {
        $data = $request->validate([
            'status' => ['sometimes', 'in:open,in_progress,resolved,closed'],
            'description' => ['sometimes', 'string'],
            'severity' => ['sometimes', 'in:low,medium,high,critical'],
            'attachments' => ['array'],
        ]);

        $failureReport->update($data);

        $this->timelineService->record(
            $failureReport->equipment_id,
            'failure_updated',
            __('وضعیت خرابی بروزرسانی شد'),
            $failureReport->description,
            ['status' => $failureReport->status]
        );

        return response()->json($failureReport->fresh());
    }
}
