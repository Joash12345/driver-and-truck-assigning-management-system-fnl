<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Trip;
use App\Models\Notification;

$trip = Trip::updateOrCreate(['id' => 'TRIP-CREATE-TEST'], ['truck_id' => 'T-CREATE-TEST', 'start_time' => now()]);
echo "trip:" . $trip->id . PHP_EOL;
echo "notifications_for_truck:" . Notification::where('user_id', 'T-CREATE-TEST')->count() . PHP_EOL;
echo "notifications_total:" . Notification::count() . PHP_EOL;
