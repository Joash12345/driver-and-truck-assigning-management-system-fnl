<?php

namespace App\Http\Controllers;

use App\Models\DriverDocument;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class DriverDocumentController extends Controller
{
    public function index(): JsonResponse
    {
        $rows = DriverDocument::orderByDesc('uploaded_at')->get();
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
            'name' => 'required|string',
            'type' => 'nullable|string',
            'path' => 'nullable|string',
            'uploaded_at' => 'nullable|date',
            'notes' => 'nullable|string',
            'data' => 'nullable|array',
        ]);

        if (empty($data['id'])) $data['id'] = (string) Str::uuid();
        if (empty($data['uploaded_at'])) $data['uploaded_at'] = now();

        $row = DriverDocument::create($data);

        return response()->json($row, 201)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    public function update(Request $request, $id): JsonResponse
    {
        $data = $request->validate([
            'name' => 'nullable|string',
            'type' => 'nullable|string',
            'path' => 'nullable|string',
            'notes' => 'nullable|string',
            'data' => 'nullable|array',
        ]);

        $row = DriverDocument::where('id', $id)->firstOrFail();
        $row->update($data);

        return response()->json($row)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    public function destroy($id): JsonResponse
    {
        $row = DriverDocument::where('id', $id)->first();
        if ($row) $row->delete();
        return response()->json(null, 204)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
}
