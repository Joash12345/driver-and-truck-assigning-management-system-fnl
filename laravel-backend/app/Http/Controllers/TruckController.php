<?php

namespace App\Http\Controllers;

use App\Models\Truck;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TruckController extends Controller
{
    public function index(): JsonResponse
    {
        $trucks = Truck::orderByDesc('created_at')->get();
        return response()->json($trucks)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => 'required|string',
            'name' => 'required|string',
            'plate_number' => 'required|string',
            'model' => 'required|string',
            'driver' => 'nullable|string',
            'fuel_level' => 'nullable|integer',
            'load_capacity' => 'nullable|numeric',
            'fuel_type' => 'nullable|string',
            'status' => 'nullable|string',
            'last_maintenance' => 'nullable|date',
        ]);

        // create or update if exists
        $truck = Truck::updateOrCreate(['id' => $data['id']], $data);

        return response()->json($truck, 201)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
}
