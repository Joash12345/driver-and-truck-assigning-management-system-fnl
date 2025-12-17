<?php

namespace App\Http\Controllers;

use App\Models\ScheduledMaintenance;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class ScheduledMaintenanceController extends Controller
{
    public function index(): JsonResponse
    {
        $rows = ScheduledMaintenance::orderByDesc('scheduled_at')->get();
        return response()->json($rows)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => 'nullable|string',
            'truck_id' => 'required|string',
            'title' => 'required|string',
            'description' => 'nullable|string',
            'scheduled_at' => 'nullable|date',
            'completed_at' => 'nullable|date',
            'status' => 'nullable|string',
            'performed_by' => 'nullable|string',
            'cost' => 'nullable|numeric',
            'data' => 'nullable|array',
        ]);

        if (empty($data['id'])) $data['id'] = (string) Str::uuid();

        $row = ScheduledMaintenance::create($data);

        return response()->json($row, 201)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    public function update(Request $request, $id): JsonResponse
    {
        $data = $request->validate([
            'title' => 'nullable|string',
            'description' => 'nullable|string',
            'scheduled_at' => 'nullable|date',
            'completed_at' => 'nullable|date',
            'status' => 'nullable|string',
            'performed_by' => 'nullable|string',
            'cost' => 'nullable|numeric',
            'data' => 'nullable|array',
        ]);

        $row = ScheduledMaintenance::where('id', $id)->firstOrFail();
        $row->update($data);

        return response()->json($row)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    public function destroy($id): JsonResponse
    {
        $row = ScheduledMaintenance::where('id', $id)->first();
        if ($row) $row->delete();
        return response()->json(null, 204)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
}
