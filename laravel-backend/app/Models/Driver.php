<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Notification;
use Illuminate\Support\Str;

class Driver extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'name',
        'license_number',
        'email',
        'phone',
        'status',
        'license_type',
        'license_expiry',
        'date_of_birth',
        'address',
        'assigned_vehicle',
    ];

    protected static function booted()
    {
        static::created(function (Driver $driver) {
            try {
                Notification::create([
                    'id' => (string) Str::uuid(),
                    'user_id' => $driver->id,
                    'type' => 'driver',
                    'title' => 'Driver created',
                    'body' => "Driver {$driver->name} was created.",
                    'data' => ['driver' => $driver->toArray()],
                    'sent_at' => now(),
                ]);
            } catch (\Throwable $e) {
                // ignore notification errors
            }
        });

        static::updated(function (Driver $driver) {
            try {
                Notification::create([
                    'id' => (string) Str::uuid(),
                    'user_id' => $driver->id,
                    'type' => 'driver',
                    'title' => 'Driver updated',
                    'body' => "Driver {$driver->name} was updated.",
                    'data' => ['driver' => $driver->toArray()],
                    'sent_at' => now(),
                ]);
            } catch (\Throwable $e) {
                // ignore notification errors
            }
        });

        static::deleted(function (Driver $driver) {
            try {
                Notification::create([
                    'id' => (string) Str::uuid(),
                    'user_id' => $driver->id,
                    'type' => 'driver',
                    'title' => 'Driver deleted',
                    'body' => "Driver {$driver->name} was deleted.",
                    'data' => ['driver' => $driver->toArray()],
                    'sent_at' => now(),
                ]);
            } catch (\Throwable $e) {
                // ignore
            }
        });
    }
}
