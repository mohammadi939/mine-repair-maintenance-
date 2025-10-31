<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReEntryApprovalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'repair_order_id' => ['required', 'integer', 'exists:repair_orders,id'],
            'form_number' => ['required', 'string', 'max:64'],
            'inspection_notes' => ['required', 'string'],
            'status' => ['required', 'in:pending,approved,rejected'],
            'safety_checks' => ['array'],
            'safety_checks.*.title' => ['required', 'string'],
            'approved_at' => ['nullable', 'date'],
        ];
    }
}
