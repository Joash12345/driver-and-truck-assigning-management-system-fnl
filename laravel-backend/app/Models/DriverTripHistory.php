<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DriverTripHistory extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id','trip_id','driver_id','truck_id','origin','destination','start_time','end_time','travel_time_seconds','origin_lat','origin_lng','dest_lat','dest_lng','status','notes','archived_at','data'
    ];

    protected $casts = [
        'data' => 'array',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'archived_at' => 'datetime',
    ];
}
