<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\TruckSchedule;
use App\Models\Notification;

$data = [
    'id' => 'TS-CREATE-TEST',
    'truck_id' => 'T-CREATE-TEST',
    'trip_id' => null,
    'start_time' => '2025-12-20 08:00:00',
    'end_time' => '2025-12-20 18:00:00',
    'driver_id' => null,
    'status' => 'planned',
    'route' => 'Route A to B',
    'notes' => 'Test schedule',
    'data' => ['note' => 'automated test']
];

$row = TruckSchedule::updateOrCreate(['id' => $data['id']], $data);

echo "truck_schedule:" . $row->id . PHP_EOL;
echo "count_schedules_for_truck:" . TruckSchedule::where('truck_id', $row->truck_id)->count() . PHP_EOL;
echo "notifications_total:" . Notification::count() . PHP_EOL;

?>
