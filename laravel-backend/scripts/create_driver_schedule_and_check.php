<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\DriverSchedule;
use App\Models\Notification;

$data = [
    'id' => 'DS-CREATE-TEST',
    'driver_id' => 'D-CREATE-TEST',
    'truck_id' => 'T-CREATE-TEST',
    'start_time' => '2025-12-21 07:00:00',
    'end_time' => '2025-12-21 17:00:00',
    'status' => 'planned',
    'route' => 'Depot -> Customer X',
    'notes' => 'Driver schedule test',
    'data' => ['note' => 'automated test']
];

$row = DriverSchedule::updateOrCreate(['id' => $data['id']], $data);

echo "driver_schedule:" . $row->id . PHP_EOL;
echo "count_schedules_for_driver:" . DriverSchedule::where('driver_id', $row->driver_id)->count() . PHP_EOL;
echo "notifications_total:" . Notification::count() . PHP_EOL;

?>
