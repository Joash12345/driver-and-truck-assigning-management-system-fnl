<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Notification;
use Illuminate\Support\Str;

class Truck extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'plate_number',
        'model',
        'driver',
        'fuel_level',
        'load_capacity',
        'fuel_type',
        'status',
        'last_maintenance',
    ];

    protected static function booted()
    {
        static::created(function (Truck $truck) {
            try {
                Notification::create([
                    'id' => (string) Str::uuid(),
                    'user_id' => $truck->id,
                    'type' => 'truck',
                    'title' => 'Truck created',
                    'body' => "Truck {$truck->name} was created.",
                    'data' => ['truck' => $truck->toArray()],
                    'sent_at' => now(),
                ]);
            } catch (\Throwable $e) {
                // ignore
            }
        });

        static::updated(function (Truck $truck) {
            try {
                Notification::create([
                    'id' => (string) Str::uuid(),
                    'user_id' => $truck->id,
                    'type' => 'truck',
                    'title' => 'Truck updated',
                    'body' => "Truck {$truck->name} was updated.",
                    'data' => ['truck' => $truck->toArray()],
                    'sent_at' => now(),
                ]);
            } catch (\Throwable $e) {
                // ignore
            }
        });

        static::deleted(function (Truck $truck) {
            try {
                Notification::create([
                    'id' => (string) Str::uuid(),
                    'user_id' => $truck->id,
                    'type' => 'truck',
                    'title' => 'Truck deleted',
                    'body' => "Truck {$truck->name} was deleted.",
                    'data' => ['truck' => $truck->toArray()],
                    'sent_at' => now(),
                ]);
            } catch (\Throwable $e) {
                // ignore
            }
        });
    }
}
