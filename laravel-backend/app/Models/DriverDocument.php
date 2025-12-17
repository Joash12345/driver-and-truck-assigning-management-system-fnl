<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DriverDocument extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id','driver_id','name','type','path','uploaded_at','notes','data'
    ];

    protected $casts = [
        'data' => 'array',
        'uploaded_at' => 'datetime',
    ];
}
