<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TruckController;
use App\Http\Controllers\DriverController;
use App\Http\Controllers\TripController;
use App\Http\Controllers\DestinationController;
use App\Http\Controllers\TrackingController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ScheduledMaintenanceController;
use App\Http\Controllers\TruckScheduleController;
use App\Http\Controllers\TripHistoryController;
use App\Http\Controllers\DriverScheduleController;
use App\Http\Controllers\DriverTripHistoryController;
use App\Http\Controllers\DriverDocumentController;

Route::post('/login', function (Request $request) {
    $request->validate([
        'email' => 'required|string',
        'password' => 'required|string',
    ]);

    $user = [
        'email' => $request->input('email'),
        'role' => 'admin',
    ];

    return response()->json([
        'user' => $user,
        'token' => 'dev-token',
    ], 200);
});

Route::get('/trucks', [TruckController::class, 'index']);
Route::post('/trucks', [TruckController::class, 'store']);
// Allow simple preflight from dev frontend
Route::options('/trucks', function () {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
});
Route::get('/drivers', [DriverController::class, 'index']);
Route::post('/drivers', [DriverController::class, 'store']);
Route::put('/drivers/{id}', [DriverController::class, 'update']);
Route::delete('/drivers/{id}', [DriverController::class, 'destroy']);
Route::options('/drivers', function () {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
});
Route::get('/trips', [TripController::class, 'index']);
Route::post('/trips', [TripController::class, 'store']);
Route::put('/trips/{id}', [TripController::class, 'update']);
Route::delete('/trips/{id}', [TripController::class, 'destroy']);
Route::options('/trips', function () {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
});
Route::get('/destinations', [DestinationController::class, 'index']);
Route::post('/destinations', [DestinationController::class, 'store']);
Route::put('/destinations/{id}', [DestinationController::class, 'update']);
Route::delete('/destinations/{id}', [DestinationController::class, 'destroy']);
Route::options('/destinations', function () {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
});
Route::get('/locations', [TrackingController::class, 'locations']);
Route::options('/locations', function () {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
});
// Scheduled maintenance
Route::get('/scheduled-maintenance', [ScheduledMaintenanceController::class, 'index']);
Route::post('/scheduled-maintenance', [ScheduledMaintenanceController::class, 'store']);
Route::put('/scheduled-maintenance/{id}', [ScheduledMaintenanceController::class, 'update']);
Route::delete('/scheduled-maintenance/{id}', [ScheduledMaintenanceController::class, 'destroy']);
Route::options('/scheduled-maintenance', function () {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
});

// Truck schedules
Route::get('/truck-schedules', [TruckScheduleController::class, 'index']);
Route::post('/truck-schedules', [TruckScheduleController::class, 'store']);
Route::put('/truck-schedules/{id}', [TruckScheduleController::class, 'update']);
Route::delete('/truck-schedules/{id}', [TruckScheduleController::class, 'destroy']);
Route::options('/truck-schedules', function () {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
});

// Trip history (archived trips)
Route::get('/trip-history', [TripHistoryController::class, 'index']);
Route::post('/trip-history', [TripHistoryController::class, 'store']);
Route::put('/trip-history/{id}', [TripHistoryController::class, 'update']);
Route::delete('/trip-history/{id}', [TripHistoryController::class, 'destroy']);
Route::options('/trip-history', function () {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
});
// Notifications
Route::get('/notifications', [NotificationController::class, 'index']);
Route::post('/notifications', [NotificationController::class, 'store']);
Route::put('/notifications/{id}', [NotificationController::class, 'update']);
Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
Route::options('/notifications', function () {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
});

// Driver Schedules
Route::get('/driver-schedules', [DriverScheduleController::class, 'index']);
Route::post('/driver-schedules', [DriverScheduleController::class, 'store']);
Route::put('/driver-schedules/{id}', [DriverScheduleController::class, 'update']);
Route::delete('/driver-schedules/{id}', [DriverScheduleController::class, 'destroy']);
Route::options('/driver-schedules', function () {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
});

// Driver Trip History
Route::get('/driver-trip-history', [DriverTripHistoryController::class, 'index']);
Route::post('/driver-trip-history', [DriverTripHistoryController::class, 'store']);
Route::put('/driver-trip-history/{id}', [DriverTripHistoryController::class, 'update']);
Route::delete('/driver-trip-history/{id}', [DriverTripHistoryController::class, 'destroy']);
Route::options('/driver-trip-history', function () {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
});

// Driver Documents
Route::get('/driver-documents', [DriverDocumentController::class, 'index']);
Route::post('/driver-documents', [DriverDocumentController::class, 'store']);
Route::put('/driver-documents/{id}', [DriverDocumentController::class, 'update']);
Route::delete('/driver-documents/{id}', [DriverDocumentController::class, 'destroy']);
Route::options('/driver-documents', function () {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', '*')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
});
