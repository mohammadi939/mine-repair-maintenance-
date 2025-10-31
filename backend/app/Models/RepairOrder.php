<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RepairOrder extends Model
{
    use HasFactory;

    protected $fillable = [
        'exit_request_id',
        'assigned_to',
        'form_number',
        'started_at',
        'completed_at',
        'actions',
        'status',
        'materials',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'actions' => 'array',
        'materials' => 'array',
    ];

    public function exitRequest()
    {
        return $this->belongsTo(ExitRequest::class);
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function reEntryApproval()
    {
        return $this->hasOne(ReEntryApproval::class);
    }
}
