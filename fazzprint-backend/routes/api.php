<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProcessController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\QRCodeController;
use App\Http\Controllers\Api\TrackingController;
use App\Http\Controllers\Api\ProfileController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes (no authentication required)
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Protected routes (authentication required)
Route::middleware('auth:sanctum')->group(function () {
    
    // Authentication routes
    Route::prefix('auth')->group(function () {
        Route::get('/profile', [AuthController::class, 'profile']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
        Route::get('/settings', [AuthController::class, 'getSettings']);
        Route::put('/settings', [AuthController::class, 'updateSettings']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/logout-all', [AuthController::class, 'logoutAll']);
        Route::get('/check-role/{role}', [AuthController::class, 'checkRole']);
    });

    // Order Management Routes
    Route::prefix('orders')->group(function () {
        Route::get('/', [OrderController::class, 'index']);
        Route::post('/', [OrderController::class, 'store']); // Customer only
        Route::post('/estimate', [OrderController::class, 'getEstimate']); // Get price estimate
        Route::get('/statistics', [OrderController::class, 'statistics']); // Admin/Sales Manager
        Route::get('/{id}', [OrderController::class, 'show']);
        Route::put('/{id}', [OrderController::class, 'update']);
        Route::post('/{id}/start', [OrderController::class, 'startOrder']); // Sales Manager only
        Route::post('/{id}/cancel', [OrderController::class, 'cancelOrder']);
        Route::post('/{id}/upload', [OrderController::class, 'uploadFile']);
        Route::get('/{orderId}/files/{fileId}/download', [OrderController::class, 'downloadFile'])
            ->name('api.orders.files.download');
        Route::delete('/{orderId}/files/{fileId}', [OrderController::class, 'deleteFile'])
            ->name('api.orders.files.delete');
    });

    // Process Management Routes (Staff workflow)
    Route::prefix('processes')->group(function () {
        Route::get('/', [ProcessController::class, 'index']); // Get user's active processes
        Route::get('/available', [ProcessController::class, 'available']); // Get available QR codes to scan
        Route::post('/scan', [ProcessController::class, 'scanQR']); // Scan QR code to start process
        Route::post('/{processId}/start', [ProcessController::class, 'startProcess']);
        Route::post('/{processId}/pause', [ProcessController::class, 'pauseProcess']);
        Route::post('/{processId}/resume', [ProcessController::class, 'resumeProcess']);
        Route::post('/{processId}/complete', [ProcessController::class, 'completeProcess']);
        Route::get('/{processId}/status', [ProcessController::class, 'getProcessStatus']);
        Route::put('/{processId}/update-quantity', [ProcessController::class, 'updateQuantity']);
    });

    // QR Code Management Routes (Sales Manager)
    Route::prefix('qr-codes')->group(function () {
        Route::get('/', [QRCodeController::class, 'index']); // List QR codes
        Route::post('/generate/{orderId}', [QRCodeController::class, 'generate']); // Generate QR for order
        Route::get('/{code}/validate', [QRCodeController::class, 'validate']); // Validate QR code
        Route::get('/{code}/info', [QRCodeController::class, 'getInfo']); // Get QR code info
        Route::post('/{code}/regenerate', [QRCodeController::class, 'regenerate']); // Regenerate QR code
    });

    // Notification Routes
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']); // Get user notifications
        Route::get('/popup', [NotificationController::class, 'popup']); // Get notifications for popup
        Route::get('/unread', [NotificationController::class, 'unread']); // Get unread count
        Route::post('/{id}/read', [NotificationController::class, 'markAsRead']); // Mark as read
        Route::post('/read-all', [NotificationController::class, 'markAllAsRead']); // Mark all as read
        Route::delete('/{id}', [NotificationController::class, 'delete']); // Delete notification
        Route::post('/create-test', [NotificationController::class, 'createTestNotifications']); // Create test notifications
    });

    // Real-time Order Tracking
    Route::prefix('tracking')->group(function () {
        Route::get('/search', [TrackingController::class, 'search']); // Search by tracking_id, order_id, or order_url
        Route::get('/order/{orderId}', [OrderController::class, 'trackOrder']); // Real-time order status
        Route::get('/live-updates', [OrderController::class, 'liveUpdates']); // SSE endpoint for live updates
    });

    // Admin-only routes
    Route::middleware(['check.role:admin'])->prefix('admin')->group(function () {
        Route::get('/users', [AuthController::class, 'getAllUsers']);
        Route::post('/users/{id}/role', [AuthController::class, 'updateUserRole']);
        Route::get('/system-stats', [OrderController::class, 'systemStatistics']);
    });

    // Sales Manager routes
    Route::middleware(['check.role:sales_manager,admin'])->prefix('sales')->group(function () {
        Route::get('/pending-orders', [OrderController::class, 'pendingOrders']);
        Route::post('/assign-staff/{orderId}', [ProcessController::class, 'assignStaff']);
        Route::get('/staff-performance', [ProcessController::class, 'staffPerformance']);
    });

    // Staff-only routes
    Route::middleware(['check.role:staff'])->prefix('staff')->group(function () {
        Route::get('/my-tasks', [ProcessController::class, 'myTasks']);
        Route::get('/work-history', [ProcessController::class, 'workHistory']);
        Route::post('/clock-in', [ProcessController::class, 'clockIn']);
        Route::post('/clock-out', [ProcessController::class, 'clockOut']);
    });

    // Customer-only routes
    Route::middleware(['check.role:customer'])->prefix('customer')->group(function () {
        Route::get('/my-orders', [OrderController::class, 'myOrders']);
        Route::get('/order-history', [OrderController::class, 'orderHistory']);
        Route::post('/reorder/{orderId}', [OrderController::class, 'reorder']);
    });

    // Dashboard stats for customers
    Route::get('/dashboard/stats', [OrderController::class, 'getDashboardStats']);
    Route::get('/dashboard/charts', [OrderController::class, 'getChartData']);

    // Profile image upload
    Route::post('/profile/image', [ProfileController::class, 'uploadProfileImage']);
});

// Test endpoint to check API status
Route::get('/status', function () {
    return response()->json([
        'success' => true,
        'message' => 'FazzPrint API is running',
        'timestamp' => now(),
        'version' => '1.0.0'
    ]);
}); 