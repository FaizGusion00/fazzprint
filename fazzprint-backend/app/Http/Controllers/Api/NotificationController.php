<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class NotificationController extends Controller
{
    /**
     * Get user notifications with pagination and filtering
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Notification::where('recipient_id', $user->user_id)
            ->with(['recipient:user_id,full_name', 'jobOrder:job_order_id,job_order_url,title']);

        // Apply filters
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('read_status')) {
            if ($request->read_status === 'read') {
                $query->where('is_read', true);
            } elseif ($request->read_status === 'unread') {
                $query->where('is_read', false);
            }
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Pagination
        $perPage = $request->get('per_page', 20);
        $notifications = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $notifications,
            'summary' => [
                'total_notifications' => $notifications->total(),
                'unread_count' => Notification::where('recipient_id', $user->user_id)
                    ->where('is_read', false)
                    ->count()
            ]
        ]);
    }

    /**
     * Get unread notifications count
     */
    public function unread(Request $request): JsonResponse
    {
        $user = $request->user();

        $unreadCount = Notification::where('recipient_id', $user->user_id)
            ->where('is_read', false)
            ->count();

        $recentNotifications = Notification::where('recipient_id', $user->user_id)
            ->where('is_read', false)
            ->where('created_at', '>=', Carbon::now()->subHours(24))
            ->with(['recipient:user_id,full_name', 'jobOrder:job_order_id,job_order_url,title'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'unread_count' => $unreadCount,
                'recent_notifications' => $recentNotifications,
                'has_unread' => $unreadCount > 0
            ]
        ]);
    }

    /**
     * Mark a specific notification as read
     */
    public function markAsRead(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        $notification = Notification::where('notification_id', $id)
            ->where('recipient_id', $user->user_id)
            ->first();

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found'
            ], 404);
        }

        if ($notification->is_read) {
            return response()->json([
                'success' => true,
                'message' => 'Notification already marked as read',
                'data' => ['notification' => $notification]
            ]);
        }

        try {
            $notification->update([
                'is_read' => true
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Notification marked as read',
                'data' => ['notification' => $notification->fresh()]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark notification as read',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();

        try {
            $updatedCount = Notification::where('recipient_id', $user->user_id)
                ->where('is_read', false)
                ->update([
                    'is_read' => true
                ]);

            return response()->json([
                'success' => true,
                'message' => 'All notifications marked as read',
                'data' => [
                    'updated_count' => $updatedCount
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark all notifications as read',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a notification
     */
    public function delete(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        $notification = Notification::where('notification_id', $id)
            ->where('recipient_id', $user->user_id)
            ->first();

        if (!$notification) {
            return response()->json([
                'success' => false,
                'message' => 'Notification not found'
            ], 404);
        }

        try {
            $notification->delete();

            return response()->json([
                'success' => true,
                'message' => 'Notification deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete notification',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk delete notifications
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'notification_ids' => 'required|array|min:1',
            'notification_ids.*' => 'integer|exists:notifications,notification_id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $deletedCount = Notification::whereIn('notification_id', $request->notification_ids)
                ->where('recipient_id', $user->user_id)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Notifications deleted successfully',
                'data' => [
                    'deleted_count' => $deletedCount
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get notification statistics for user
     */
    public function statistics(Request $request): JsonResponse
    {
        $user = $request->user();
        $period = $request->get('period', 'month'); // week, month, year

        $baseQuery = Notification::where('recipient_id', $user->user_id);

        if ($period === 'week') {
            $baseQuery->where('created_at', '>=', Carbon::now()->subWeek());
        } elseif ($period === 'month') {
            $baseQuery->where('created_at', '>=', Carbon::now()->subMonth());
        } elseif ($period === 'year') {
            $baseQuery->where('created_at', '>=', Carbon::now()->subYear());
        }

        $statistics = [
            'period' => $period,
            'total_notifications' => (clone $baseQuery)->count(),
            'read_notifications' => (clone $baseQuery)->where('is_read', true)->count(),
            'unread_notifications' => (clone $baseQuery)->where('is_read', false)->count(),
            'high_priority' => (clone $baseQuery)->where('priority', Notification::PRIORITY_HIGH)->count(),
            'medium_priority' => (clone $baseQuery)->where('priority', Notification::PRIORITY_MEDIUM)->count(),
            'low_priority' => (clone $baseQuery)->where('priority', Notification::PRIORITY_LOW)->count(),
            'notifications_by_type' => (clone $baseQuery)
                ->selectRaw('notification_type, COUNT(*) as count')
                ->groupBy('notification_type')
                ->pluck('count', 'notification_type'),
            'daily_breakdown' => (clone $baseQuery)
                ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
                ->groupBy('date')
                ->orderBy('date', 'desc')
                ->limit(30)
                ->pluck('count', 'date'),
            'response_time_avg' => (clone $baseQuery)
                ->whereNotNull('read_at')
                ->selectRaw('AVG(TIMESTAMPDIFF(MINUTE, created_at, read_at)) as avg_minutes')
                ->value('avg_minutes')
        ];

        return response()->json([
            'success' => true,
            'data' => $statistics
        ]);
    }

    /**
     * Update notification preferences
     */
    public function updatePreferences(Request $request): JsonResponse
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'email_notifications' => 'boolean',
            'push_notifications' => 'boolean',
            'sms_notifications' => 'boolean',
            'notification_types' => 'array',
            'notification_types.*' => 'string|in:order_status,process_update,system_alert,reminder',
            'quiet_hours_start' => 'nullable|date_format:H:i',
            'quiet_hours_end' => 'nullable|date_format:H:i',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Update user notification preferences
            $preferences = $user->notification_preferences ?? [];
            
            if ($request->has('email_notifications')) {
                $preferences['email_notifications'] = $request->email_notifications;
            }
            
            if ($request->has('push_notifications')) {
                $preferences['push_notifications'] = $request->push_notifications;
            }
            
            if ($request->has('sms_notifications')) {
                $preferences['sms_notifications'] = $request->sms_notifications;
            }
            
            if ($request->has('notification_types')) {
                $preferences['enabled_types'] = $request->notification_types;
            }
            
            if ($request->has('quiet_hours_start')) {
                $preferences['quiet_hours_start'] = $request->quiet_hours_start;
            }
            
            if ($request->has('quiet_hours_end')) {
                $preferences['quiet_hours_end'] = $request->quiet_hours_end;
            }

            $user->update(['notification_preferences' => $preferences]);

            return response()->json([
                'success' => true,
                'message' => 'Notification preferences updated successfully',
                'data' => [
                    'preferences' => $preferences
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update notification preferences',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get notification preferences
     */
    public function getPreferences(Request $request): JsonResponse
    {
        $user = $request->user();

        $defaultPreferences = [
            'email_notifications' => true,
            'push_notifications' => true,
            'sms_notifications' => false,
            'enabled_types' => ['order_status', 'process_update', 'system_alert'],
            'quiet_hours_start' => null,
            'quiet_hours_end' => null
        ];

        $preferences = array_merge($defaultPreferences, $user->notification_preferences ?? []);

        return response()->json([
            'success' => true,
            'data' => [
                'preferences' => $preferences,
                'available_types' => [
                    'order_status' => 'Order Status Updates',
                    'process_update' => 'Process Updates',
                    'system_alert' => 'System Alerts',
                    'reminder' => 'Reminders'
                ]
            ]
        ]);
    }

    /**
     * Test notification (for debugging)
     */
    public function testNotification(Request $request): JsonResponse
    {
        $user = $request->user();

        // Only allow in development/testing environment
        if (app()->environment('production')) {
            return response()->json([
                'success' => false,
                'message' => 'Test notifications not allowed in production'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'type' => 'required|string',
            'message' => 'required|string|max:500',
            'priority' => 'nullable|in:low,medium,high',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $notification = Notification::create([
                'recipient_id' => $user->user_id,
                'sender_id' => $user->user_id,
                'notification_type' => $request->type,
                'title' => 'Test Notification',
                'message' => $request->message,
                'priority' => $request->priority ?? Notification::PRIORITY_MEDIUM,
                'data' => ['test' => true],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Test notification created successfully',
                'data' => ['notification' => $notification]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create test notification',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create test notifications for debugging (temporary endpoint)
     */
    public function createTestNotifications(Request $request): JsonResponse
    {
        $user = $request->user();
        
        try {
            // Create some sample notifications
            $notifications = [
                [
                    'recipient_id' => $user->user_id,
                    'type' => 'general',
                    'title' => 'Welcome to FazzPrint!',
                    'message' => 'Thank you for registering with us. We look forward to serving your printing needs.',
                    'is_read' => false,
                    'email_sent' => false
                ],
                [
                    'recipient_id' => $user->user_id,
                    'type' => 'order_created',
                    'title' => 'Order Confirmation',
                    'message' => 'Your order has been received and is being processed.',
                    'is_read' => false,
                    'email_sent' => false
                ],
                [
                    'recipient_id' => $user->user_id,
                    'type' => 'order_in_progress',
                    'title' => 'Order Update',
                    'message' => 'Your printing order is now in progress.',
                    'is_read' => true,
                    'email_sent' => false
                ]
            ];

            foreach ($notifications as $notificationData) {
                Notification::create($notificationData);
            }

            return response()->json([
                'success' => true,
                'message' => 'Test notifications created successfully',
                'data' => ['created_count' => count($notifications)]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create test notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get notifications for popup (simple format)
     * Returns only type, title, message for the notification popup
     */
    public function popup(Request $request): JsonResponse
    {
        $user = $request->user();

        // Get recent notifications (limit to 10 for popup)
        $notifications = Notification::where('recipient_id', $user->user_id)
            ->select('notification_id', 'type', 'title', 'message', 'is_read', 'created_at')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Get unread count
        $unreadCount = Notification::where('recipient_id', $user->user_id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'notifications' => $notifications,
                'unread_count' => $unreadCount
            ]
        ]);
    }
}
