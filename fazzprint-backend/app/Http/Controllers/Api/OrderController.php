<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JobOrder;
use App\Models\OrderFile;
use App\Services\ProcessManagementService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class OrderController extends Controller
{
    protected ProcessManagementService $processService;

    public function __construct(ProcessManagementService $processService)
    {
        $this->processService = $processService;
    }

    /**
     * Get all orders for the authenticated user (role-based)
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = JobOrder::query();

        // Filter based on user role
        switch ($user->role) {
            case 'customer':
                $query->where('customer_id', $user->user_id);
                break;
            case 'sales_manager':
                // Sales managers can see all orders
                break;
            case 'staff':
                // Staff can see orders they're working on
                $query->whereHas('processSteps.processes', function ($q) use ($user) {
                    $q->where('pic_id', $user->user_id);
                });
                break;
            case 'admin':
                // Admins can see all orders
                break;
        }

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('job_order_url', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $orders = $query->with(['customer:user_id,full_name,email', 'salesManager:user_id,full_name'])
                       ->orderBy('created_at', 'desc')
                       ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $orders
        ]);
    }

    /**
     * Create a new order (Customer only)
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        // Only customers can create orders
        if (!$user->isCustomer()) {
            return response()->json([
                'success' => false,
                'message' => 'Only customers can create orders'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'quantity' => 'required|integer|min:1',
            'design_requirements' => 'nullable|string',
            'special_instructions' => 'nullable|string',
            'due_date' => 'nullable|date|after:today',
            'files' => 'nullable|array',
            'files.*' => 'file|max:51200', // 50MB max per file
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Create order using the process management service
            $jobOrder = $this->processService->createJobOrder($user, $request->all());

            // Handle file uploads with improved validation
            if ($request->hasFile('files')) {
                foreach ($request->file('files') as $file) {
                    $this->uploadOrderFile($jobOrder, $file, $user);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Order created successfully',
                'data' => [
                    'job_order' => $jobOrder->load(['processSteps', 'orderFiles'])
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Order creation failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get specific order details
     */
    public function show(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        
        $query = JobOrder::with([
            'customer:user_id,full_name,email,phone_number',
            'salesManager:user_id,full_name',
            'processSteps.processes.staff:user_id,full_name',
            'orderFiles',
            'qrCode',
            'notifications' => function ($q) use ($user) {
                $q->where('recipient_id', $user->user_id);
            },
            'orderTrackings' => function ($q) {
                $q->orderBy('created_at', 'desc');
            }
        ]);

        // Apply role-based access control
        switch ($user->role) {
            case 'customer':
                $query->where('customer_id', $user->user_id);
                break;
            case 'staff':
                $query->whereHas('processSteps.processes', function ($q) use ($user) {
                    $q->where('pic_id', $user->user_id);
                });
                break;
            // Sales managers and admins can access any order
        }

        $jobOrder = $query->find($id);

        if (!$jobOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found or access denied'
            ], 404);
        }

        // Get real-time status information
        $statusInfo = $this->processService->getOrderStatus($jobOrder);

        return response()->json([
            'success' => true,
            'data' => [
                'job_order' => $jobOrder,
                'status_info' => $statusInfo
            ]
        ]);
    }

    /**
     * Update order (Limited fields based on role and status)
     */
    public function update(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $jobOrder = JobOrder::find($id);

        if (!$jobOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found'
            ], 404);
        }

        // Check permissions
        if ($user->isCustomer() && $jobOrder->customer_id !== $user->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied'
            ], 403);
        }

        // Customers can only edit draft orders
        if ($user->isCustomer() && $jobOrder->status !== JobOrder::STATUS_DRAFT) {
            return response()->json([
                'success' => false,
                'message' => 'Order cannot be modified after approval'
            ], 422);
        }

        $allowedFields = [];
        switch ($user->role) {
            case 'customer':
                $allowedFields = ['title', 'description', 'quantity', 'design_requirements', 'special_instructions', 'due_date'];
                break;
            case 'sales_manager':
            case 'admin':
                $allowedFields = ['title', 'description', 'quantity', 'design_requirements', 'special_instructions', 'due_date', 'status'];
                break;
            default:
                return response()->json([
                    'success' => false,
                    'message' => 'Insufficient permissions'
                ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'quantity' => 'sometimes|integer|min:1',
            'design_requirements' => 'sometimes|nullable|string',
            'special_instructions' => 'sometimes|nullable|string',
            'due_date' => 'sometimes|nullable|date|after:today',
            'status' => 'sometimes|in:draft,started,in_progress,completed,cancelled',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $jobOrder->fill($request->only($allowedFields));
            $jobOrder->save();

            return response()->json([
                'success' => true,
                'message' => 'Order updated successfully',
                'data' => [
                    'job_order' => $jobOrder->load(['processSteps', 'orderFiles'])
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Order update failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Start order (Sales Manager only)
     */
    public function startOrder(Request $request, $id): JsonResponse
    {
        $user = $request->user();

        if (!$user->isSalesManager() && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Only sales managers can start orders'
            ], 403);
        }

        $jobOrder = JobOrder::find($id);

        if (!$jobOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found'
            ], 404);
        }

        if ($jobOrder->status !== JobOrder::STATUS_DRAFT) {
            return response()->json([
                'success' => false,
                'message' => 'Order is not in draft status'
            ], 422);
        }

        try {
            $this->processService->startJobOrder($jobOrder, $user);

            return response()->json([
                'success' => true,
                'message' => 'Order started successfully',
                'data' => [
                    'job_order' => $jobOrder->load(['qrCode'])
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to start order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel order
     */
    public function cancelOrder(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $jobOrder = JobOrder::find($id);

        if (!$jobOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found'
            ], 404);
        }

        // Check permissions
        $canCancel = false;
        if ($user->isCustomer() && $jobOrder->customer_id === $user->user_id && $jobOrder->status === JobOrder::STATUS_DRAFT) {
            $canCancel = true;
        } elseif ($user->isSalesManager() || $user->isAdmin()) {
            $canCancel = true;
        }

        if (!$canCancel) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot cancel this order'
            ], 403);
        }

        try {
            $jobOrder->update(['status' => JobOrder::STATUS_CANCELLED]);

            return response()->json([
                'success' => true,
                'message' => 'Order cancelled successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to cancel order',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload additional files to existing order
     */
    public function uploadFile(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $jobOrder = JobOrder::find($id);

        if (!$jobOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found'
            ], 404);
        }

        // Check permissions
        if ($user->isCustomer() && $jobOrder->customer_id !== $user->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:51200', // 50MB max
            'description' => 'nullable|string|max:255',
            'is_design_file' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $file = $request->file('file');
            
            // Enhanced file validation
            $allowedMimeTypes = [
                'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
                'application/pdf',
                'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'text/plain', 'text/csv',
                'application/zip', 'application/x-rar-compressed',
                'application/x-photoshop', 'application/postscript' // PSD, AI files
            ];

            if (!in_array($file->getMimeType(), $allowedMimeTypes)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File type not supported. Please upload images, documents, or design files.'
                ], 422);
            }

            $orderFile = $this->uploadOrderFile($jobOrder, $file, $user, $request->description, $request->boolean('is_design_file'));

            return response()->json([
                'success' => true,
                'message' => 'File uploaded successfully',
                'data' => [
                    'file' => $orderFile->load('uploader:user_id,full_name')
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('File upload failed', [
                'order_id' => $id,
                'user_id' => $user->user_id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'File upload failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download order file
     */
    public function downloadFile(Request $request, $orderId, $fileId): BinaryFileResponse|JsonResponse
    {
        $user = $request->user();
        
        // Find the order and file
        $jobOrder = JobOrder::find($orderId);
        if (!$jobOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found'
            ], 404);
        }

        // Check permissions
        if ($user->isCustomer() && $jobOrder->customer_id !== $user->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied'
            ], 403);
        }

        $orderFile = OrderFile::where('file_id', $fileId)
                              ->where('job_order_id', $orderId)
                              ->first();

        if (!$orderFile) {
            return response()->json([
                'success' => false,
                'message' => 'File not found'
            ], 404);
        }

        // Check if file exists in storage
        if (!Storage::disk('public')->exists($orderFile->file_path)) {
            return response()->json([
                'success' => false,
                'message' => 'File not found in storage'
            ], 404);
        }

        $filePath = Storage::disk('public')->path($orderFile->file_path);
        
        return Response::download($filePath, $orderFile->file_name, [
            'Content-Type' => $orderFile->mime_type,
        ]);
    }

    /**
     * Delete order file
     */
    public function deleteFile(Request $request, $orderId, $fileId): JsonResponse
    {
        $user = $request->user();
        
        // Find the order and file
        $jobOrder = JobOrder::find($orderId);
        if (!$jobOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found'
            ], 404);
        }

        // Check permissions - only customers can delete files from their own draft orders
        if (!$user->isCustomer() || $jobOrder->customer_id !== $user->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied'
            ], 403);
        }

        if ($jobOrder->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete files from orders that are already in progress'
            ], 422);
        }

        $orderFile = OrderFile::where('file_id', $fileId)
                              ->where('job_order_id', $orderId)
                              ->first();

        if (!$orderFile) {
            return response()->json([
                'success' => false,
                'message' => 'File not found'
            ], 404);
        }

        try {
            // Delete file from storage
            if (Storage::disk('public')->exists($orderFile->file_path)) {
                Storage::disk('public')->delete($orderFile->file_path);
            }

            // Delete file record
            $orderFile->delete();

            return response()->json([
                'success' => true,
                'message' => 'File deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('File deletion failed', [
                'order_id' => $orderId,
                'file_id' => $fileId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'File deletion failed'
            ], 500);
        }
    }

    /**
     * Get order statistics (Admin/Sales Manager)
     */
    public function statistics(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isSalesManager() && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied'
            ], 403);
        }

        $stats = [
            'total_orders' => JobOrder::count(),
            'draft_orders' => JobOrder::where('status', JobOrder::STATUS_DRAFT)->count(),
            'active_orders' => JobOrder::whereIn('status', [JobOrder::STATUS_STARTED, JobOrder::STATUS_IN_PROGRESS])->count(),
            'completed_orders' => JobOrder::where('status', JobOrder::STATUS_COMPLETED)->count(),
            'cancelled_orders' => JobOrder::where('status', JobOrder::STATUS_CANCELLED)->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Helper method to upload order files with enhanced validation and processing
     */
    private function uploadOrderFile(JobOrder $jobOrder, $file, $user, $description = null, $isDesignFile = false): OrderFile
    {
        $originalName = $file->getClientOriginalName();
        $extension = strtolower($file->getClientOriginalExtension());
        $mimeType = $file->getMimeType();
        
        // Generate safe filename
        $safeFileName = preg_replace('/[^a-zA-Z0-9._-]/', '_', pathinfo($originalName, PATHINFO_FILENAME));
        $fileName = time() . '_' . uniqid() . '_' . $safeFileName . '.' . $extension;
        
        // Create directory if it doesn't exist
        $orderDir = 'order_files/' . $jobOrder->job_order_id;
        if (!Storage::disk('public')->exists($orderDir)) {
            Storage::disk('public')->makeDirectory($orderDir);
        }
        
        // Store file with proper path
        $path = $file->storeAs($orderDir, $fileName, 'public');
        
        // Auto-detect if it's a design file based on file type
        $designFileExtensions = ['psd', 'ai', 'eps', 'svg', 'sketch', 'fig'];
        $autoDetectedDesignFile = $isDesignFile || in_array($extension, $designFileExtensions);

        // Log file upload for debugging
        Log::info('File uploaded', [
            'order_id' => $jobOrder->job_order_id,
            'original_name' => $originalName,
            'stored_name' => $fileName,
            'size' => $file->getSize(),
            'mime_type' => $mimeType,
            'is_design_file' => $autoDetectedDesignFile
        ]);

        return OrderFile::create([
            'job_order_id' => $jobOrder->job_order_id,
            'uploaded_by' => $user->user_id,
            'file_name' => $originalName,
            'file_path' => $path,
            'file_size' => $file->getSize(),
            'file_type' => $extension,
            'mime_type' => $mimeType,
            'description' => $description,
            'is_design_file' => $autoDetectedDesignFile,
        ]);
    }

    /**
     * Track order by ID with real-time status (Customers can track their own orders)
     */
    public function trackOrder(Request $request, $orderId): JsonResponse
    {
        $user = $request->user();
        
        $query = JobOrder::with([
            'customer:user_id,full_name,email',
            'salesManager:user_id,full_name',
            'processSteps.processes.staff:user_id,full_name',
            'orderFiles',
            'qrCode',
            'paymentConfirmer:user_id,full_name'
        ]);

        // Apply role-based access control
        if ($user->isCustomer()) {
            $query->where('customer_id', $user->user_id);
        }
        // Staff, sales managers, and admins can track any order

        $jobOrder = $query->find($orderId);

        if (!$jobOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found or access denied'
            ], 404);
        }

        // Get detailed tracking information
        $trackingHistory = collect();
        
        // Add order creation event
        $trackingHistory->push([
            'event' => 'Order Created',
            'status' => 'draft',
            'timestamp' => $jobOrder->created_at,
            'description' => 'Order was created by customer',
            'progress_percentage' => 10
        ]);

        // Add order start event if started
        if ($jobOrder->status !== 'draft') {
            $trackingHistory->push([
                'event' => 'Order Started',
                'status' => 'started',
                'timestamp' => $jobOrder->updated_at,
                'description' => 'Order approved and started by sales manager',
                'progress_percentage' => 25
            ]);
        }

        // Add process steps
        $totalSteps = $jobOrder->processSteps->count();
        $completedSteps = 0;
        
        foreach ($jobOrder->processSteps as $index => $step) {
            $completedProcesses = $step->processes->where('status', 'completed');
            if ($completedProcesses->count() > 0) {
                $completedSteps++;
                $lastProcess = $completedProcesses->sortByDesc('end_time')->first();
                $progressPercentage = 25 + (($completedSteps / $totalSteps) * 50);
                
                $trackingHistory->push([
                    'event' => $step->step_name,
                    'status' => 'in_progress',
                    'timestamp' => $lastProcess->end_time,
                    'description' => "Completed by {$lastProcess->staff->full_name}",
                    'progress_percentage' => $progressPercentage,
                    'quantity_completed' => $lastProcess->quantity_completed,
                    'quality_notes' => $lastProcess->quality_notes
                ]);
            }
        }

        // Add completion event if completed
        if ($jobOrder->status === 'completed') {
            $trackingHistory->push([
                'event' => 'Order Completed',
                'status' => 'completed',
                'timestamp' => $jobOrder->updated_at,
                'description' => 'Order processing completed successfully',
                'progress_percentage' => 100
            ]);
        }

        // Sort by timestamp
        $trackingHistory = $trackingHistory->sortBy('timestamp')->values();

        // Calculate overall progress
        $overallProgress = 10; // Base progress for creation
        if ($jobOrder->status !== 'draft') {
            $overallProgress = 25; // Started
            if ($totalSteps > 0) {
                $overallProgress += ($completedSteps / $totalSteps) * 50;
            }
            if ($jobOrder->status === 'completed') {
                $overallProgress = 100;
            }
        }

        // Get estimated completion time
        $estimatedCompletion = null;
        if ($jobOrder->due_date) {
            $estimatedCompletion = $jobOrder->due_date;
        } elseif ($jobOrder->status === 'started' || $jobOrder->status === 'in_progress') {
            // Estimate based on remaining steps and average processing time
            $remainingSteps = $totalSteps - $completedSteps;
            $avgTimePerStep = 2; // hours
            $estimatedCompletion = now()->addHours($remainingSteps * $avgTimePerStep);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'job_order' => $jobOrder,
                'tracking_history' => $trackingHistory,
                'progress' => [
                    'percentage' => round($overallProgress, 1),
                    'current_status' => $jobOrder->status,
                    'completed_steps' => $completedSteps,
                    'total_steps' => $totalSteps,
                    'estimated_completion' => $estimatedCompletion
                ],
                'next_steps' => $this->getNextSteps($jobOrder),
                'can_cancel' => $jobOrder->status === 'draft' && $user->isCustomer()
            ]
        ]);
    }

    /**
     * Get customer's orders (Customer-specific endpoint)
     */
    public function myOrders(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isCustomer()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Customers only.'
            ], 403);
        }

        $query = JobOrder::where('customer_id', $user->user_id)
            ->with(['processSteps.processes', 'orderFiles']);

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('job_order_url', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
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
        $perPage = $request->get('per_page', 15);
        $orders = $query->paginate($perPage);

        // Add progress calculation for each order
        $orders->getCollection()->transform(function ($order) {
            $totalSteps = $order->processSteps->count();
            $completedSteps = $order->processSteps->filter(function ($step) {
                return $step->processes->where('status', 'completed')->count() > 0;
            })->count();

            $progress = 10; // Base progress
            if ($order->status !== 'draft') {
                $progress = 25;
                if ($totalSteps > 0) {
                    $progress += ($completedSteps / $totalSteps) * 50;
                }
                if ($order->status === 'completed') {
                    $progress = 100;
                }
            }

            $order->progress_percentage = round($progress, 1);
            $order->completed_steps = $completedSteps;
            $order->total_steps = $totalSteps;

            return $order;
        });

        return response()->json([
            'success' => true,
            'data' => $orders
        ]);
    }

    /**
     * Get order history for customer
     */
    public function orderHistory(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isCustomer()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Customers only.'
            ], 403);
        }

        $period = $request->get('period', 'all'); // week, month, year, all
        
        $query = JobOrder::where('customer_id', $user->user_id);

        if ($period === 'week') {
            $query->where('created_at', '>=', now()->subWeek());
        } elseif ($period === 'month') {
            $query->where('created_at', '>=', now()->subMonth());
        } elseif ($period === 'year') {
            $query->where('created_at', '>=', now()->subYear());
        }

        $orders = $query->orderBy('created_at', 'desc')->get();

        $statistics = [
            'total_orders' => $orders->count(),
            'completed_orders' => $orders->where('status', 'completed')->count(),
            'in_progress_orders' => $orders->whereIn('status', ['started', 'in_progress'])->count(),
            'draft_orders' => $orders->where('status', 'draft')->count(),
            'cancelled_orders' => $orders->where('status', 'cancelled')->count(),
            'total_quantity' => $orders->sum('quantity'),
            'period' => $period
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'orders' => $orders,
                'statistics' => $statistics
            ]
        ]);
    }

    /**
     * Reorder (duplicate existing order)
     */
    public function reorder(Request $request, $orderId): JsonResponse
    {
        $user = $request->user();

        if (!$user->isCustomer()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Customers only.'
            ], 403);
        }

        $originalOrder = JobOrder::where('customer_id', $user->user_id)->find($orderId);

        if (!$originalOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Order not found or access denied'
            ], 404);
        }

        try {
            // Create new order with same details
            $newOrderData = [
                'title' => 'Reorder: ' . $originalOrder->title,
                'description' => $originalOrder->description,
                'quantity' => $originalOrder->quantity,
                'design_requirements' => $originalOrder->design_requirements,
                'special_instructions' => $originalOrder->special_instructions,
                'due_date' => $request->due_date
            ];

            $newOrder = $this->processService->createJobOrder($user, $newOrderData);

            return response()->json([
                'success' => true,
                'message' => 'Order reordered successfully',
                'data' => [
                    'new_order' => $newOrder,
                    'original_order' => $originalOrder
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reorder',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get dashboard statistics for customers
     */
    public function getDashboardStats(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isCustomer()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Customers only.'
            ], 403);
        }

        $stats = [
            'total_orders' => JobOrder::where('customer_id', $user->user_id)->count(),
            'completed_orders' => JobOrder::where('customer_id', $user->user_id)
                ->where('status', 'completed')->count(),
            'in_progress_orders' => JobOrder::where('customer_id', $user->user_id)
                ->whereIn('status', ['started', 'in_progress'])->count(),
            'pending_orders' => JobOrder::where('customer_id', $user->user_id)
                ->where('status', 'draft')->count(),
            'recent_orders' => JobOrder::where('customer_id', $user->user_id)
                ->with(['processSteps'])
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($order) {
                    $totalSteps = $order->processSteps->count();
                    $completedSteps = $order->processSteps->filter(function ($step) {
                        return $step->processes->where('status', 'completed')->count() > 0;
                    })->count();

                    $progress = 10;
                    if ($order->status !== 'draft') {
                        $progress = 25;
                        if ($totalSteps > 0) {
                            $progress += ($completedSteps / $totalSteps) * 50;
                        }
                        if ($order->status === 'completed') {
                            $progress = 100;
                        }
                    }

                    $order->progress_percentage = round($progress, 1);
                    return $order;
                })
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Helper method to get next steps for an order
     */
    private function getNextSteps(JobOrder $jobOrder): array
    {
        $nextSteps = [];

        if ($jobOrder->status === 'draft') {
            $nextSteps[] = [
                'step' => 'Approval',
                'description' => 'Waiting for sales manager approval',
                'estimated_time' => '1-2 business days'
            ];
        } elseif ($jobOrder->status === 'started' || $jobOrder->status === 'in_progress') {
            $incompleteSteps = $jobOrder->processSteps->filter(function ($step) {
                return $step->processes->where('status', 'completed')->count() === 0;
            });

            foreach ($incompleteSteps->take(3) as $step) {
                $nextSteps[] = [
                    'step' => $step->step_name,
                    'description' => $step->description ?: 'Processing step',
                    'estimated_time' => $step->estimated_duration ?: '2-4 hours'
                ];
            }
        }

        return $nextSteps;
    }

    /**
     * Get price estimate for an order
     */
    public function getEstimate(Request $request)
    {
        $request->validate([
            'material' => 'nullable|string',
            'paper_size' => 'nullable|string',
            'quantity' => 'required|integer|min:1',
            'color_mode' => 'nullable|string',
            'binding_type' => 'nullable|string',
            'lamination' => 'nullable|boolean',
            'design_complexity' => 'nullable|string'
        ]);

        try {
            // Base Malaysian printing prices (in MYR)
            $basePrices = [
                'A4' => 0.50,      // RM 0.50 per page
                'A3' => 1.00,      // RM 1.00 per page
                'A5' => 0.25,      // RM 0.25 per page
                'Letter' => 0.50,  // RM 0.50 per page
                'Legal' => 0.65,   // RM 0.65 per page
            ];

            // T-shirt printing prices (Malaysian market rates)
            $tshirtPrices = [
                'basic' => 35.00,     // RM 35 for basic t-shirt
                'premium' => 45.00,   // RM 45 for premium t-shirt
                'custom' => 40.00,    // RM 40 for custom design
            ];

            $paperSize = $request->paper_size ?? 'A4';
            $quantity = $request->quantity;
            $colorMode = $request->color_mode ?? 'black_white';
            $bindingType = $request->binding_type ?? 'none';
            $lamination = $request->lamination ?? false;
            $material = $request->material ?? 'paper';
            
            // Determine if this is t-shirt printing or paper printing
            if ($material === 'fabric' || $material === 'tshirt' || strpos(strtolower($request->title ?? ''), 'shirt') !== false) {
                // T-shirt printing pricing
                $basePrice = $tshirtPrices['custom']; // Default to custom t-shirt price
                
                // Adjust price based on design complexity
                $designComplexity = $request->design_complexity ?? 'medium';
                switch ($designComplexity) {
                    case 'simple':
                        $basePrice = $tshirtPrices['basic'];
                        break;
                    case 'complex':
                        $basePrice = $tshirtPrices['premium'];
                        break;
                    default:
                        $basePrice = $tshirtPrices['custom'];
                }
                
                // Color mode affects t-shirt pricing
                $colorMultiplier = $colorMode === 'color' ? 1.2 : 1.0; // 20% more for color
                
                $costPerItem = $basePrice * $colorMultiplier;
                $totalCost = $costPerItem * $quantity;
                
                // Volume discounts for t-shirts
                if ($quantity >= 50) {
                    $totalCost *= 0.85; // 15% discount for 50+
                } elseif ($quantity >= 20) {
                    $totalCost *= 0.90; // 10% discount for 20+
                } elseif ($quantity >= 10) {
                    $totalCost *= 0.95; // 5% discount for 10+
                }
                
                $breakdown = [
                    'base_cost_per_item' => round($costPerItem, 2),
                    'quantity' => $quantity,
                    'subtotal' => round($costPerItem * $quantity, 2),
                    'discount_applied' => $quantity >= 10,
                    'final_total' => round($totalCost, 2)
                ];
                
            } else {
                // Paper printing pricing
                $basePrice = $basePrices[$paperSize] ?? $basePrices['A4'];
                
                // Color multiplier for paper
                $colorMultiplier = $colorMode === 'color' ? 3.0 : 1.0;
                
                // Binding costs (in MYR)
                $bindingCosts = [
                    'none' => 0,
                    'staple' => 0.50,    // RM 0.50
                    'spiral' => 2.00,    // RM 2.00
                    'perfect' => 5.00,   // RM 5.00
                    'saddle' => 1.00,    // RM 1.00
                ];
                
                $bindingCost = $bindingCosts[$bindingType] ?? 0;
                
                // Lamination cost per page
                $laminationCost = $lamination ? ($basePrice * 0.5) : 0;
                
                // Calculate total cost
                $costPerPage = $basePrice * $colorMultiplier;
                $totalCost = ($costPerPage + $laminationCost) * $quantity + $bindingCost;
                
                // Volume discounts for paper printing
                if ($quantity >= 1000) {
                    $totalCost *= 0.85; // 15% discount
                } elseif ($quantity >= 500) {
                    $totalCost *= 0.90; // 10% discount
                } elseif ($quantity >= 100) {
                    $totalCost *= 0.95; // 5% discount
                }
                
                $breakdown = [
                    'base_cost_per_page' => round($costPerPage, 2),
                    'quantity' => $quantity,
                    'subtotal' => round(($costPerPage + $laminationCost) * $quantity, 2),
                    'binding_cost' => round($bindingCost, 2),
                    'lamination_cost' => round($laminationCost * $quantity, 2),
                    'discount_applied' => $quantity >= 100,
                    'final_total' => round($totalCost, 2)
                ];
            }
            
            // Estimate completion time
            $productionTimePerItem = $material === 'fabric' || $material === 'tshirt' ? 5 : 0.5; // 5 minutes per t-shirt, 30 seconds per page
            $setupTime = 30; // 30 minutes setup
            $bindingTime = $bindingType !== 'none' ? 15 : 0; // 15 minutes for binding
            
            $totalMinutes = $setupTime + ($quantity * $productionTimePerItem) + $bindingTime;
            $workingHoursPerDay = 8;
            $workingDays = ceil($totalMinutes / (60 * $workingHoursPerDay));
            
            // Add buffer time for Malaysian business practices
            $estimatedDays = max(1, $workingDays + 1); // Minimum 1 day + 1 day buffer
            
            $estimatedCompletion = now()->addDays($estimatedDays)->format('Y-m-d');
            
            return response()->json([
                'success' => true,
                'data' => [
                    'estimated_cost' => round($totalCost, 2),
                    'estimated_duration' => $estimatedDays . ' working days',
                    'estimated_completion' => $estimatedCompletion,
                    'breakdown' => $breakdown,
                    'currency' => 'MYR',
                    'note' => 'This is an estimated quote. Final pricing will be confirmed by our sales team.'
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate estimate',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get chart data for customer analytics
     */
    public function getChartData()
    {
        try {
            $user = auth()->user();
            
            if (!$user) {
                return response()->json(['message' => 'Unauthorized'], 401);
            }

            // Orders trend for last 12 months
            $ordersTrend = [];
            for ($i = 11; $i >= 0; $i--) {
                $date = now()->subMonths($i);
                $count = JobOrder::where('customer_id', $user->user_id)
                    ->whereMonth('created_at', $date->month)
                    ->whereYear('created_at', $date->year)
                    ->count();
                
                $ordersTrend[] = [
                    'month' => $date->format('M Y'),
                    'orders' => $count,
                    'monthShort' => $date->format('M'),
                    'year' => $date->format('Y')
                ];
            }

            // Order status distribution
            $statusDistribution = JobOrder::where('customer_id', $user->user_id)
                ->selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->get()
                ->map(function($item) {
                    return [
                        'status' => ucfirst(str_replace('_', ' ', $item->status)),
                        'count' => $item->count,
                        'value' => $item->count
                    ];
                });

            // Monthly spending (using quantity as estimation since total_price may not exist)
            $spendingTrend = [];
            for ($i = 11; $i >= 0; $i--) {
                $date = now()->subMonths($i);
                
                // Use quantity multiplied by an estimated base price since total_price column may not exist
                $totalQuantity = JobOrder::where('customer_id', $user->user_id)
                    ->whereMonth('created_at', $date->month)
                    ->whereYear('created_at', $date->year)
                    ->sum('quantity') ?? 0;
                
                // Estimate spending as quantity * average price per unit (Malaysian context: RM 0.50 per A4 page)
                $estimatedAmount = $totalQuantity * 0.50; // RM 0.50 per page
                
                $spendingTrend[] = [
                    'month' => $date->format('M Y'),
                    'amount' => (float) $estimatedAmount,
                    'monthShort' => $date->format('M'),
                    'year' => $date->format('Y')
                ];
            }

            // Order completion rate by month
            $completionRate = [];
            for ($i = 5; $i >= 0; $i--) {
                $date = now()->subMonths($i);
                $total = JobOrder::where('customer_id', $user->user_id)
                    ->whereMonth('created_at', $date->month)
                    ->whereYear('created_at', $date->year)
                    ->count();
                
                $completed = JobOrder::where('customer_id', $user->user_id)
                    ->whereMonth('created_at', $date->month)
                    ->whereYear('created_at', $date->year)
                    ->where('status', 'completed')
                    ->count();
                
                $rate = $total > 0 ? round(($completed / $total) * 100, 1) : 0;
                
                $completionRate[] = [
                    'month' => $date->format('M Y'),
                    'rate' => $rate,
                    'completed' => $completed,
                    'total' => $total,
                    'monthShort' => $date->format('M')
                ];
            }

            return response()->json([
                'message' => 'Chart data retrieved successfully',
                'data' => [
                    'orders_trend' => $ordersTrend,
                    'status_distribution' => $statusDistribution,
                    'spending_trend' => $spendingTrend,
                    'completion_rate' => $completionRate
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Chart data error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to retrieve chart data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
