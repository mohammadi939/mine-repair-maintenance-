<?php

namespace App\Http\Controllers;

use App\Models\Equipment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class EquipmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Equipment::with('unit');

        if ($request->filled('unit_id')) {
            $query->where('unit_id', $request->integer('unit_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $equipments = $query->paginate(15);

        return response()->json($equipments);
    }

    public function show(Equipment $equipment): JsonResponse
    {
        return response()->json($equipment->load(['unit', 'failureReports' => fn ($q) => $q->latest()->limit(5)]));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string'],
            'code' => ['required', 'string', 'unique:equipments,code'],
            'unit_id' => ['required', 'exists:units,id'],
            'location' => ['nullable', 'string'],
            'status' => ['required', 'string'],
            'metadata' => ['array'],
        ]);

        $equipment = Equipment::create($data);

        $this->generateQr($equipment);

        return response()->json($equipment->fresh(), 201);
    }

    public function update(Request $request, Equipment $equipment): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string'],
            'code' => ['sometimes', 'string', 'unique:equipments,code,' . $equipment->id],
            'unit_id' => ['sometimes', 'exists:units,id'],
            'location' => ['nullable', 'string'],
            'status' => ['sometimes', 'string'],
            'metadata' => ['array'],
            'last_service_at' => ['nullable', 'date'],
        ]);

        $equipment->update($data);

        if ($request->boolean('refresh_qr')) {
            $this->generateQr($equipment);
        }

        return response()->json($equipment->fresh());
    }

    public function destroy(Equipment $equipment): JsonResponse
    {
        $equipment->delete();

        return response()->json(['message' => __('دستگاه حذف شد')]);
    }

    public function qr(Equipment $equipment): JsonResponse
    {
        if (!$equipment->qr_code_path || !Storage::disk('public')->exists($equipment->qr_code_path)) {
            $this->generateQr($equipment);
        }

        $url = Storage::disk('public')->url($equipment->qr_code_path);

        return response()->json([
            'qr_url' => $url,
        ]);
    }

    protected function generateQr(Equipment $equipment): void
    {
        $payload = json_encode([
            'id' => $equipment->id,
            'code' => $equipment->code,
            'name' => $equipment->name,
        ], JSON_UNESCAPED_UNICODE);

        $svg = QrCode::format('svg')->size(300)->margin(2)->generate($payload);
        $path = 'qrcodes/' . $equipment->code . '.svg';
        Storage::disk('public')->put($path, $svg);

        $equipment->update(['qr_code_path' => $path]);
    }
}
