<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TruckSchedule extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'truck_id', 'trip_id', 'start_time', 'end_time', 'driver_id', 'status', 'route', 'notes', 'data'
    ];

    protected $casts = [
        'data' => 'array',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];
}
