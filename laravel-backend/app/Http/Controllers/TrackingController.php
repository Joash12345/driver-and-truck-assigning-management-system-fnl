<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TrackingController extends Controller
{
    // Return simulated positions for trucks in the database
    public function locations()
    {
        // Fetch trucks (id and status) from DB
        $trucks = DB::table('trucks')->select('id', 'status')->get();

        $centerLat = 14.5995; // Manila
        $centerLng = 120.9842;

        $positions = [];
        $now = time();

        foreach ($trucks as $i => $t) {
            // deterministic jitter based on id to keep positions stable between calls
            $seed = crc32($t->id . ($i + 1));
            $rnd = ($seed % 1000) / 1000.0;
            $lat = $centerLat + ($rnd - 0.5) * 0.3 + (($t->status === 'intransit') ? 0.005 : 0);
            $lng = $centerLng + (($seed >> 8) % 1000) / 1000.0 - 0.5 * 0.3 + (($t->status === 'intransit') ? 0.005 : 0);

            $positions[] = [
                'id' => $t->id,
                'lat' => round($lat, 6),
                'lng' => round($lng, 6),
                'status' => $t->status,
                'updated_at' => date('c', $now),
            ];
        }

        return response()->json($positions, 200)
            ->header('Access-Control-Allow-Origin', '*')
            ->header('Access-Control-Allow-Methods', 'GET, OPTIONS')
            ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
}
