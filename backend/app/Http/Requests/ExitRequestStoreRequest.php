<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ExitRequestStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'equipment_id' => ['required', 'integer', 'exists:equipments,id'],
            'form_number' => ['required', 'string', 'max:64'],
            'request_type' => ['required', 'in:repair,inspection,external'],
            'reason' => ['required', 'string'],
            'expected_return_at' => ['nullable', 'date'],
            'payload' => ['array'],
            'payload.items' => ['array'],
            'payload.items.*.description' => ['required', 'string'],
            'payload.items.*.quantity' => ['required', 'numeric', 'gt:0'],
            'payload.items.*.unit' => ['required', 'string'],
            'payload.items.*.code' => ['nullable', 'string'],
            'payload.driver_name' => ['nullable', 'string'],
        ];
    }
}
