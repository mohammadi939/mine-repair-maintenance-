<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FailureReport extends Model
{
    use HasFactory;

    protected $fillable = [
        'equipment_id',
        'reported_by',
        'failure_code',
        'severity',
        'description',
        'reported_at',
        'status',
        'attachments',
    ];

    protected $casts = [
        'attachments' => 'array',
        'reported_at' => 'datetime',
    ];

    public function equipment()
    {
        return $this->belongsTo(Equipment::class);
    }

    public function reporter()
    {
        return $this->belongsTo(User::class, 'reported_by');
    }
}
