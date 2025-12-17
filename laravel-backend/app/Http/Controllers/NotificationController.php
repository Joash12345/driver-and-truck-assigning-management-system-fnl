<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class NotificationController extends Controller
{
    public function index(): JsonResponse
    {
        $rows = Notification::orderByDesc('created_at')->get();
        return response()->json($rows)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'id' => 'nullable|string',
            'user_id' => 'nullable|string',
            'type' => 'nullable|string',
            'title' => 'required|string',
            'body' => 'nullable|string',
            'data' => 'nullable|array',
            'read_at' => 'nullable|date',
            'sent_at' => 'nullable|date',
        ]);

        if (empty($data['id'])) {
            $data['id'] = (string) Str::uuid();
        }

        $row = Notification::create($data);

        return response()->json($row, 201)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    public function update(Request $request, $id): JsonResponse
    {
        $data = $request->validate([
            'user_id' => 'nullable|string',
            'type' => 'nullable|string',
            'title' => 'nullable|string',
            'body' => 'nullable|string',
            'data' => 'nullable|array',
            'read_at' => 'nullable|date',
            'sent_at' => 'nullable|date',
        ]);

        $row = Notification::where('id', $id)->firstOrFail();
        $row->update($data);

        return response()->json($row)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    public function destroy($id): JsonResponse
    {
        $row = Notification::where('id', $id)->first();
        if ($row) $row->delete();
        return response()->json(null, 204)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
}
