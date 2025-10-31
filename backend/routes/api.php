<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DelayNotificationController;
use App\Http\Controllers\EquipmentController;
use App\Http\Controllers\ExitRequestController;
use App\Http\Controllers\FailureReportController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RepairOrderController;
use App\Http\Controllers\ReEntryApprovalController;
use App\Http\Controllers\TimelineController;
use App\Http\Controllers\UnitController;
use Illuminate\Support\Facades\Route;

Route::post('auth/login', [AuthController::class, 'login']);

Route::middleware(['auth:api'])->group(function () {
    Route::get('auth/me', [AuthController::class, 'me']);
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::post('auth/refresh', [AuthController::class, 'refresh']);

    Route::get('dashboard', DashboardController::class);
    Route::get('units', [UnitController::class, 'index']);

    Route::get('equipments', [EquipmentController::class, 'index']);
    Route::post('equipments', [EquipmentController::class, 'store'])->middleware('role:manager,storekeeper');
    Route::get('equipments/{equipment}', [EquipmentController::class, 'show']);
    Route::put('equipments/{equipment}', [EquipmentController::class, 'update'])->middleware('role:manager,storekeeper');
    Route::delete('equipments/{equipment}', [EquipmentController::class, 'destroy'])->middleware('role:manager');
    Route::get('equipments/{equipment}/qr', [EquipmentController::class, 'qr']);

    Route::get('failures', [FailureReportController::class, 'index']);
    Route::post('failures', [FailureReportController::class, 'store']);
    Route::patch('failures/{failureReport}', [FailureReportController::class, 'update']);

    Route::get('exit-requests', [ExitRequestController::class, 'index']);
    Route::post('exit-requests', [ExitRequestController::class, 'store']);
    Route::post('exit-requests/{exitRequest}/approve', [ExitRequestController::class, 'approve'])->middleware('role:manager,storekeeper');
    Route::post('exit-requests/{exitRequest}/reject', [ExitRequestController::class, 'reject'])->middleware('role:manager,storekeeper');

    Route::get('repair-orders', [RepairOrderController::class, 'index']);
    Route::post('repair-orders', [RepairOrderController::class, 'store']);
    Route::patch('repair-orders/{repairOrder}', [RepairOrderController::class, 'update']);

    Route::get('re-entry', [ReEntryApprovalController::class, 'index']);
    Route::post('re-entry', [ReEntryApprovalController::class, 'store']);

    Route::get('timeline', [TimelineController::class, 'index']);

    Route::get('notifications', [DelayNotificationController::class, 'index']);
    Route::post('notifications/{notification}/sent', [DelayNotificationController::class, 'markSent']);

    Route::get('reports/failures/excel', [ReportController::class, 'failuresExcel']);
    Route::get('reports/failures/pdf', [ReportController::class, 'failuresPdf']);
    Route::get('reports/repairs/excel', [ReportController::class, 'repairsExcel']);
    Route::get('reports/repairs/pdf', [ReportController::class, 'repairsPdf']);
});
