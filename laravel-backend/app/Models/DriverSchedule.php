<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DriverSchedule extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id','driver_id','truck_id','start_time','end_time','status','route','notes','data'
    ];

    protected $casts = [
        'data' => 'array',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];
}
