<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReEntryApproval extends Model
{
    use HasFactory;

    protected $fillable = [
        'repair_order_id',
        'approved_by',
        'form_number',
        'inspection_notes',
        'approved_at',
        'status',
        'safety_checks',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'safety_checks' => 'array',
    ];

    public function repairOrder()
    {
        return $this->belongsTo(RepairOrder::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
