<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Notification;
use Illuminate\Support\Str;

class Trip extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'truck_id',
        'driver_id',
        'driver_name',
        'origin',
        'destination',
        'start_time',
        'end_time',
        'travel_time_seconds',
        'origin_lat',
        'origin_lng',
        'dest_lat',
        'dest_lng',
        'status',
        'cargo',
        'cargo_tons',
        'notes',
    ];
    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'travel_time_seconds' => 'integer',
    ];

    protected static function booted()
    {
        static::created(function (Trip $trip) {
            try {
                Notification::create([
                    'id' => (string) Str::uuid(),
                    'user_id' => $trip->truck_id,
                    'type' => 'trip',
                    'title' => 'Trip scheduled',
                    'body' => "Trip {$trip->id} scheduled for truck {$trip->truck_id}.",
                    'data' => ['trip' => $trip->toArray()],
                    'sent_at' => now(),
                ]);
            } catch (\Throwable $e) {
                // ignore
            }
        });

        static::updated(function (Trip $trip) {
            try {
                Notification::create([
                    'id' => (string) Str::uuid(),
                    'user_id' => $trip->truck_id,
                    'type' => 'trip',
                    'title' => 'Trip updated',
                    'body' => "Trip {$trip->id} updated (status: {$trip->status}).",
                    'data' => ['trip' => $trip->toArray()],
                    'sent_at' => now(),
                ]);
            } catch (\Throwable $e) {
                // ignore
            }
        });

        static::deleted(function (Trip $trip) {
            try {
                Notification::create([
                    'id' => (string) Str::uuid(),
                    'user_id' => $trip->truck_id,
                    'type' => 'trip',
                    'title' => 'Trip cancelled',
                    'body' => "Trip {$trip->id} was deleted/cancelled.",
                    'data' => ['trip' => $trip->toArray()],
                    'sent_at' => now(),
                ]);
            } catch (\Throwable $e) {
                // ignore
            }
        });
    }
}
