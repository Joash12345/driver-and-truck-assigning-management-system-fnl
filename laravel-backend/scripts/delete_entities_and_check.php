<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Driver;
use App\Models\Truck;
use App\Models\Trip;
use App\Models\Notification;

// delete test entities if they exist
foreach (['D-CREATE-TEST'] as $did) {
    $d = Driver::where('id', $did)->first();
    if ($d) {
        $d->delete();
        echo "deleted_driver:" . $did . PHP_EOL;
    }
}

foreach (['T-CREATE-TEST'] as $tid) {
    $t = Truck::where('id', $tid)->first();
    if ($t) {
        $t->delete();
        echo "deleted_truck:" . $tid . PHP_EOL;
    }
}

foreach (['TRIP-CREATE-TEST'] as $tripid) {
    $tr = Trip::where('id', $tripid)->first();
    if ($tr) {
        $tr->delete();
        echo "deleted_trip:" . $tripid . PHP_EOL;
    }
}

echo "notifications_total:" . Notification::count() . PHP_EOL;
