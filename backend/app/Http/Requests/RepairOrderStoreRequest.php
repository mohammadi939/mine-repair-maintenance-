<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RepairOrderStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'exit_request_id' => ['required', 'integer', 'exists:exit_requests,id'],
            'form_number' => ['required', 'string', 'max:64'],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
            'started_at' => ['nullable', 'date'],
            'completed_at' => ['nullable', 'date', 'after_or_equal:started_at'],
            'status' => ['required', 'in:pending,in_progress,completed,returned'],
            'actions' => ['array'],
            'actions.*.description' => ['required', 'string'],
            'materials' => ['array'],
            'materials.*.description' => ['required', 'string'],
        ];
    }
}
