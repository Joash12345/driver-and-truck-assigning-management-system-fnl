<?php

namespace App\Http\Controllers;

use App\Models\Driver;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class DriverController extends Controller
{
    public function index(): JsonResponse
    {
        $drivers = Driver::orderByDesc('created_at')->get();
        return response()->json($drivers)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => 'required|string',
            'name' => 'required|string',
            'license_number' => 'required|string',
            'email' => 'required|email',
            'phone' => 'nullable|string',
            'status' => 'nullable|string',
            'license_type' => 'nullable|string',
            'license_expiry' => 'nullable|date',
            'date_of_birth' => 'nullable|date',
            'address' => 'nullable|string',
            'assigned_vehicle' => 'nullable|string',
        ]);

        $driver = Driver::updateOrCreate(['id' => $data['id']], $data);

        try {
            Notification::create([
                'id' => (string) Str::uuid(),
                'user_id' => $driver->id,
                'type' => 'driver',
                'title' => 'Driver added',
                'body' => "Driver {$driver->name} was added.",
                'data' => ['driver' => $driver->toArray()],
                'sent_at' => now(),
            ]);
        } catch (\Throwable $e) {
            // don't block driver creation on notification errors
        }

        return response()->json($driver, 201)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    public function update(Request $request, $id): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string',
            'license_number' => 'required|string',
            'email' => 'required|email',
            'phone' => 'nullable|string',
            'status' => 'nullable|string',
            'license_type' => 'nullable|string',
            'license_expiry' => 'nullable|date',
            'date_of_birth' => 'nullable|date',
            'address' => 'nullable|string',
            'assigned_vehicle' => 'nullable|string',
        ]);

        $driver = Driver::where('id', $id)->firstOrFail();
        $driver->update($data);

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

        return response()->json($driver)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    public function destroy($id): JsonResponse
    {
        $driver = Driver::where('id', $id)->first();
        if ($driver) $driver->delete();
        return response()->json(null, 204)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
}
