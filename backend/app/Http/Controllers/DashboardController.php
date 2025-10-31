<?php

namespace App\Http\Controllers;

use App\Models\DelayNotification;
use App\Models\Equipment;
use App\Models\ExitRequest;
use App\Models\FailureReport;
use App\Models\RepairOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $today = now();
        $startMonth = $today->copy()->startOfMonth();

        $stats = [
            'equipment_total' => Equipment::count(),
            'failures_open' => FailureReport::whereIn('status', ['open', 'in_progress'])->count(),
            'exit_pending' => ExitRequest::where('status', 'pending')->count(),
            'repair_in_progress' => RepairOrder::where('status', 'in_progress')->count(),
            'delays' => DelayNotification::whereNull('sent_at')->count(),
        ];

        $monthlyFailures = FailureReport::select(DB::raw('DATE(reported_at) as day'), DB::raw('count(*) as total'))
            ->where('reported_at', '>=', $startMonth)
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        $timeline = DelayNotification::latest()->limit(5)->get();

        return response()->json([
            'stats' => $stats,
            'monthlyFailures' => $monthlyFailures,
            'recentDelays' => $timeline,
        ]);
    }
}
