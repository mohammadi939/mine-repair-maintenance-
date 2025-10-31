<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExitRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'equipment_id',
        'requested_by',
        'form_number',
        'request_type',
        'reason',
        'expected_return_at',
        'approved_at',
        'status',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
        'expected_return_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function equipment()
    {
        return $this->belongsTo(Equipment::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function repairOrder()
    {
        return $this->hasOne(RepairOrder::class);
    }
}
