<?php

namespace App\Http\Controllers;

use App\Models\TripHistory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class TripHistoryController extends Controller
{
    public function index(): JsonResponse
    {
        $rows = TripHistory::orderByDesc('archived_at')->get();
        return response()->json($rows)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => 'nullable|string',
            'trip_id' => 'nullable|string',
            'truck_id' => 'nullable|string',
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
            'archived_at' => 'nullable|date',
            'data' => 'nullable|array',
        ]);

        if (empty($data['id'])) $data['id'] = (string) Str::uuid();
        if (empty($data['archived_at'])) $data['archived_at'] = now();

        $row = TripHistory::create($data);

        return response()->json($row, 201)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    public function update(Request $request, $id): JsonResponse
    {
        $data = $request->validate([
            'status' => 'nullable|string',
            'notes' => 'nullable|string',
            'data' => 'nullable|array',
        ]);

        $row = TripHistory::where('id', $id)->firstOrFail();
        $row->update($data);

        return response()->json($row)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    public function destroy($id): JsonResponse
    {
        $row = TripHistory::where('id', $id)->first();
        if ($row) $row->delete();
        return response()->json(null, 204)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
}
