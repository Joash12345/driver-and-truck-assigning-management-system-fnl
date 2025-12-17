<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\ScheduledMaintenance;
use App\Models\Notification;

$data = [
    'id' => 'SM-CREATE-TEST',
    'truck_id' => 'T-CREATE-TEST',
    'title' => 'oil',
    'description' => 'Upcoming maintenance for this vehicle',
    'scheduled_at' => '2025-12-18 10:00:00',
    'status' => 'scheduled',
    'performed_by' => null,
    'cost' => null,
    'data' => ['notes' => 'olive oil']
];

$row = ScheduledMaintenance::updateOrCreate(['id' => $data['id']], $data);

echo "scheduled_maintenance:" . $row->id . PHP_EOL;
echo "count_sm_for_truck:" . ScheduledMaintenance::where('truck_id', $row->truck_id)->count() . PHP_EOL;
echo "notifications_total:" . Notification::count() . PHP_EOL;
