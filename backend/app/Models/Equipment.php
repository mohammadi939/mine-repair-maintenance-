<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Equipment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'unit_id',
        'location',
        'status',
        'qr_code_path',
        'last_service_at',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'last_service_at' => 'datetime',
    ];

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function failureReports()
    {
        return $this->hasMany(FailureReport::class);
    }

    public function exitRequests()
    {
        return $this->hasMany(ExitRequest::class);
    }
}
