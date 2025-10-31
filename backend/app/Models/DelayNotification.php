<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DelayNotification extends Model
{
    use HasFactory;

    protected $fillable = [
        'equipment_id',
        'related_type',
        'related_id',
        'message',
        'expected_at',
        'sent_at',
        'status',
    ];

    protected $casts = [
        'expected_at' => 'datetime',
        'sent_at' => 'datetime',
    ];

    public function equipment()
    {
        return $this->belongsTo(Equipment::class);
    }
}
