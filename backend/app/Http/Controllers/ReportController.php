<?php

namespace App\Http\Controllers;

use App\Models\RepairOrder;
use App\Models\FailureReport;
use App\Services\Exports\GenericArrayExport;
use Barryvdh\DomPDF\Facade as PDF;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ReportController extends Controller
{
    public function failuresExcel(Request $request): BinaryFileResponse
    {
        $data = $this->buildFailureCollection($request);

        return Excel::download(new GenericArrayExport($data), 'failure_reports.xlsx');
    }

    public function failuresPdf(Request $request)
    {
        $data = $this->buildFailureCollection($request);
        $pdf = PDF::loadView('reports.failures', ['items' => $data]);
        return $pdf->download('failure_reports.pdf');
    }

    public function repairsExcel(Request $request): BinaryFileResponse
    {
        $data = $this->buildRepairCollection($request);
        return Excel::download(new GenericArrayExport($data), 'repair_orders.xlsx');
    }

    public function repairsPdf(Request $request)
    {
        $data = $this->buildRepairCollection($request);
        $pdf = PDF::loadView('reports.repairs', ['items' => $data]);
        return $pdf->download('repair_orders.pdf');
    }

    protected function buildFailureCollection(Request $request): Collection
    {
        $query = FailureReport::with(['equipment', 'reporter']);

        if ($request->filled('from')) {
            $query->where('reported_at', '>=', $request->date('from'));
        }
        if ($request->filled('to')) {
            $query->where('reported_at', '<=', $request->date('to'));
        }

        return $query->get()->map(function ($report) {
            return [
                'شماره' => $report->id,
                'دستگاه' => $report->equipment->name,
                'کد' => $report->failure_code,
                'شدت' => $report->severity,
                'شرح' => $report->description,
                'گزارش دهنده' => optional($report->reporter)->name,
                'تاریخ' => $report->reported_at?->format('Y-m-d H:i'),
                'وضعیت' => $report->status,
            ];
        });
    }

    protected function buildRepairCollection(Request $request): Collection
    {
        $query = RepairOrder::with(['exitRequest.equipment', 'assignee']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        return $query->get()->map(function ($order) {
            return [
                'شماره فرم' => $order->form_number,
                'دستگاه' => optional($order->exitRequest->equipment)->name,
                'وضعیت' => $order->status,
                'شروع' => $order->started_at?->format('Y-m-d H:i'),
                'پایان' => $order->completed_at?->format('Y-m-d H:i'),
                'مسئول' => optional($order->assignee)->name,
            ];
        });
    }
}
