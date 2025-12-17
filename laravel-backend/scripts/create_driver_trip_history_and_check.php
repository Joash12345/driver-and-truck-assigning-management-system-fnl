<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\DriverTripHistory;
use App\Models\Notification;

$data = [
    'id' => 'DTH-CREATE-TEST',
    'trip_id' => 'TRIP-CREATE-TEST',
    'driver_id' => 'D-CREATE-TEST',
    'truck_id' => 'T-CREATE-TEST',
    'origin' => 'Depot A',
    'destination' => 'Customer Y',
    'start_time' => '2025-12-12 09:00:00',
    'end_time' => '2025-12-12 13:30:00',
    'travel_time_seconds' => 16200,
    'origin_lat' => 37.7749,
    'origin_lng' => -122.4194,
    'dest_lat' => 36.7783,
    'dest_lng' => -119.4179,
    'status' => 'completed',
    'notes' => 'Driver trip history test',
    'archived_at' => '2025-12-12 13:30:00',
    'data' => ['meta' => 'driver-history-test']
];

$row = DriverTripHistory::updateOrCreate(['id' => $data['id']], $data);

echo "driver_trip_history:" . $row->id . PHP_EOL;
echo "count_driver_history_for_driver:" . DriverTripHistory::where('driver_id', $row->driver_id)->count() . PHP_EOL;
echo "notifications_total:" . Notification::count() . PHP_EOL;

?>
