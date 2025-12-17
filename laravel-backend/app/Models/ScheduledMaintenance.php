<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScheduledMaintenance extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'truck_id', 'title', 'description', 'scheduled_at', 'completed_at', 'status', 'performed_by', 'cost', 'data'
    ];

    protected $casts = [
        'data' => 'array',
        'scheduled_at' => 'datetime',
        'completed_at' => 'datetime',
    ];
}
