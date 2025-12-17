<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Destination;

class DestinationController extends Controller
{
    public function index()
    {
        $destinations = Destination::orderBy('id', 'desc')->get();
        return response()->json($destinations, 200)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
        ]);

        $dest = Destination::create($data);

        return response()->json($dest, 201)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    public function update(Request $request, $id)
    {
        $dest = Destination::find($id);
        if (! $dest) {
            return response()->json(['message' => 'Not found'], 404)
                ->header('Access-Control-Allow-Origin', '*');
        }

        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'address' => 'nullable|string',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
        ]);

        $dest->update($data);

        return response()->json($dest, 200)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    public function destroy($id)
    {
        $dest = Destination::find($id);
        if (! $dest) {
            return response()->json(['message' => 'Not found'], 404)
                ->header('Access-Control-Allow-Origin', '*');
        }

        $dest->delete();

        return response()->json(['message' => 'Deleted'], 200)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
}
