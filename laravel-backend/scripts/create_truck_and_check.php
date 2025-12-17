<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Truck;
use App\Models\Notification;

$t = Truck::updateOrCreate(['id' => 'T-CREATE-TEST'], ['name' => 'Test Truck', 'plate_number' => 'PL-1', 'model' => 'M-1']);
echo "truck:" . $t->id . PHP_EOL;
echo "notifications_for_truck:" . Notification::where('user_id', $t->id)->count() . PHP_EOL;
echo "notifications_total:" . Notification::count() . PHP_EOL;
