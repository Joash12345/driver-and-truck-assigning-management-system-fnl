<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\DriverDocument;
use App\Models\Notification;

$data = [
    'id' => 'DD-CREATE-TEST',
    'driver_id' => 'D-CREATE-TEST',
    'name' => 'License',
    'type' => 'license',
    'path' => '/files/DD-CREATE-TEST-license.pdf',
    'uploaded_at' => '2025-12-01 10:00:00',
    'notes' => 'Driver license upload (test)',
    'data' => ['verified' => false]
];

$row = DriverDocument::updateOrCreate(['id' => $data['id']], $data);

echo "driver_document:" . $row->id . PHP_EOL;
echo "count_documents_for_driver:" . DriverDocument::where('driver_id', $row->driver_id)->count() . PHP_EOL;
echo "notifications_total:" . Notification::count() . PHP_EOL;

?>
