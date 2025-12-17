<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\TripHistory;
use App\Models\Notification;

$data = [
    'id' => 'TH-CREATE-TEST',
    'trip_id' => 'TRIP-CREATE-TEST',
    'truck_id' => 'T-CREATE-TEST',
    'driver_id' => 'D-CREATE-TEST',
    'driver_name' => 'Test Driver',
    'origin' => 'Point A',
    'destination' => 'Point B',
    'start_time' => '2025-12-10 08:00:00',
    'end_time' => '2025-12-10 12:00:00',
    'travel_time_seconds' => 14400,
    'origin_lat' => 37.7749,
    'origin_lng' => -122.4194,
    'dest_lat' => 34.0522,
    'dest_lng' => -118.2437,
    'status' => 'completed',
    'cargo' => 'Goods',
    'cargo_tons' => '2',
    'notes' => 'Test archive',
    'archived_at' => '2025-12-10 12:00:00',
    'data' => ['meta' => 'test']
];

$row = TripHistory::updateOrCreate(['id' => $data['id']], $data);

echo "trip_history:" . $row->id . PHP_EOL;
echo "count_history_for_truck:" . TripHistory::where('truck_id', $row->truck_id)->count() . PHP_EOL;
echo "notifications_total:" . Notification::count() . PHP_EOL;

?>