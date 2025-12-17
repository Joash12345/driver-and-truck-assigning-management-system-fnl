<?php
// Boot Laravel and create a driver via Eloquent to trigger model events
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Driver;
use App\Models\Notification;
use Illuminate\Support\Str;

// create or update driver
$d = Driver::updateOrCreate(['id' => 'D-CREATE-TEST'], [
    'name' => 'Create Test Driver',
    'license_number' => 'LT-123',
    'email' => 'create-test@example.com',
]);

echo "driver_created:" . $d->id . PHP_EOL;

$count = Notification::where('user_id', $d->id)->count();
echo "notifications_for_driver:" . $count . PHP_EOL;

$total = Notification::count();
echo "notifications_total:" . $total . PHP_EOL;
