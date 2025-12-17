<?php

namespace App\Http\Controllers;

use App\Models\Trip;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class TripController extends Controller
{
    public function index(): JsonResponse
    {
        $trips = Trip::orderByDesc('created_at')->get();
        return response()->json($trips)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    public function store(Request $request): JsonResponse
    {
        Log::info('[TripController] store called', ['input' => $request->all()]);
        $data = $request->validate([
            'id' => 'required|string',
            'truck_id' => 'required|string',
            'driver_id' => 'nullable|string',
            'driver_name' => 'nullable|string',
            'origin' => 'nullable|string',
            'destination' => 'nullable|string',
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date',
            'travel_time_seconds' => 'nullable|numeric',
            'origin_lat' => 'nullable|numeric',
            'origin_lng' => 'nullable|numeric',
            'dest_lat' => 'nullable|numeric',
            'dest_lng' => 'nullable|numeric',
            'status' => 'nullable|string',
            'cargo' => 'nullable|string',
            'cargo_tons' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $trip = Trip::updateOrCreate(['id' => $data['id']], $data);

        Log::info('[TripController] trip saved', ['id' => $trip->id]);

        return response()->json($trip, 201)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    public function update(Request $request, $id): JsonResponse
    {
        Log::info('[TripController] update called', ['id' => $id, 'input' => $request->all()]);
        $data = $request->validate([
            'truck_id' => 'required|string',
            'driver_id' => 'nullable|string',
            'driver_name' => 'nullable|string',
            'origin' => 'nullable|string',
            'destination' => 'nullable|string',
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date',
            'travel_time_seconds' => 'nullable|numeric',
            'origin_lat' => 'nullable|numeric',
            'origin_lng' => 'nullable|numeric',
            'dest_lat' => 'nullable|numeric',
            'dest_lng' => 'nullable|numeric',
            'status' => 'nullable|string',
            'cargo' => 'nullable|string',
            'cargo_tons' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $trip = Trip::where('id', $id)->firstOrFail();
        $trip->update($data);

        Log::info('[TripController] trip updated', ['id' => $trip->id]);

        return response()->json($trip)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    public function destroy($id): JsonResponse
    {
        $trip = Trip::where('id', $id)->first();
        if ($trip) $trip->delete();
        return response()->json(null, 204)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
}
