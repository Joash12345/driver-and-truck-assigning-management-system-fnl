<?php

namespace App\Http\Controllers;

use App\Models\DriverSchedule;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class DriverScheduleController extends Controller
{
    public function index(): JsonResponse
    {
        $rows = DriverSchedule::orderByDesc('start_time')->get();
        return response()->json($rows)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => 'nullable|string',
            'driver_id' => 'required|string',
            'truck_id' => 'nullable|string',
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date',
            'status' => 'nullable|string',
            'route' => 'nullable|string',
            'notes' => 'nullable|string',
            'data' => 'nullable|array',
        ]);

        if (empty($data['id'])) $data['id'] = (string) Str::uuid();

        $row = DriverSchedule::create($data);

        return response()->json($row, 201)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    public function update(Request $request, $id): JsonResponse
    {
        $data = $request->validate([
            'truck_id' => 'nullable|string',
            'start_time' => 'nullable|date',
            'end_time' => 'nullable|date',
            'status' => 'nullable|string',
            'route' => 'nullable|string',
            'notes' => 'nullable|string',
            'data' => 'nullable|array',
        ]);

        $row = DriverSchedule::where('id', $id)->firstOrFail();
        $row->update($data);

        return response()->json($row)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    public function destroy($id): JsonResponse
    {
        $row = DriverSchedule::where('id', $id)->first();
        if ($row) $row->delete();
        return response()->json(null, 204)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
}
