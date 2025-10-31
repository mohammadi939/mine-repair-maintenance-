<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FailureReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'equipment_id' => ['required', 'integer', 'exists:equipments,id'],
            'failure_code' => ['required', 'string', 'max:64'],
            'severity' => ['required', 'in:low,medium,high,critical'],
            'description' => ['required', 'string'],
            'reported_at' => ['nullable', 'date'],
            'attachments' => ['array'],
            'attachments.*' => ['string'],
        ];
    }
}
