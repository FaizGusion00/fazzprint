<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QRCode;
use App\Models\JobOrder;
use App\Services\ProcessManagementService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class QRCodeController extends Controller
{
    protected ProcessManagementService $processService;

    public function __construct(ProcessManagementService $processService)
    {
        $this->processService = $processService;
    }

    /**
     * Get all QR codes (Sales Manager/Admin)
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isSalesManager() && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Sales managers and admins only.'
            ], 403);
        }

        $query = QRCode::with([
            'jobOrder:job_order_id,title,status,customer_id',
            'jobOrder.customer:user_id,full_name'
        ]);

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('job_order_id')) {
            $query->where('job_order_id', $request->job_order_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('jobOrder', function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('job_order_url', 'like', "%{$search}%");
            });
        }

        // Pagination
        $perPage = $request->get('per_page', 15);
        $qrCodes = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $qrCodes
        ]);
    }

    /**
     * Generate QR code for a job order (Sales Manager/Admin)
     */
    public function generate(Request $request, $orderId): JsonResponse
    {
        $user = $request->user();

        if (!$user->isSalesManager() && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Sales managers and admins only.'
            ], 403);
        }

        $jobOrder = JobOrder::find($orderId);

        if (!$jobOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Job order not found'
            ], 404);
        }

        // Check if order is in correct status
        if ($jobOrder->status !== JobOrder::STATUS_DRAFT) {
            return response()->json([
                'success' => false,
                'message' => 'Can only generate QR codes for draft orders'
            ], 422);
        }

        // Check if QR code already exists
        $existingQR = QRCode::where('job_order_id', $orderId)->first();
        if ($existingQR) {
            return response()->json([
                'success' => false,
                'message' => 'QR code already exists for this order',
                'data' => ['existing_qr' => $existingQR]
            ], 422);
        }

        try {
            // Generate QR code using the process service
            $qrCode = $this->processService->generateQRCode($jobOrder, $user);

            return response()->json([
                'success' => true,
                'message' => 'QR code generated successfully',
                'data' => [
                    'qr_code' => $qrCode->load(['jobOrder'])
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate QR code',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Validate QR code (Staff)
     */
    public function validate(Request $request, $code): JsonResponse
    {
        $user = $request->user();

        if (!$user->isStaff()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Staff only.'
            ], 403);
        }

        try {
            $qrCode = $this->processService->validateQRCode($code);

            if (!$qrCode) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired QR code'
                ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => 'QR code is valid',
                'data' => [
                    'qr_code' => $qrCode,
                    'is_valid' => true,
                    'expires_at' => $qrCode->expires_at,
                    'time_remaining' => $qrCode->expires_at ? Carbon::now()->diffInMinutes($qrCode->expires_at, false) : null
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'QR code validation failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get QR code information (All authenticated users)
     */
    public function getInfo(Request $request, $code): JsonResponse
    {
        $user = $request->user();

        try {
            // Try to decode the QR code data
            $qrData = $this->processService->decodeQRData($code);
            
            if (!$qrData) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid QR code format'
                ], 422);
            }

            $qrCode = QRCode::where('qr_data', $code)
                ->with([
                    'jobOrder:job_order_id,title,description,quantity,status,customer_id',
                    'jobOrder.customer:user_id,full_name,email',
                    'jobOrder.processSteps'
                ])
                ->first();

            if (!$qrCode) {
                return response()->json([
                    'success' => false,
                    'message' => 'QR code not found'
                ], 404);
            }

            // Role-based access control
            $canAccess = false;
            switch ($user->role) {
                case 'customer':
                    $canAccess = $qrCode->jobOrder->customer_id === $user->user_id;
                    break;
                case 'staff':
                case 'sales_manager':
                case 'admin':
                    $canAccess = true;
                    break;
            }

            if (!$canAccess) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied to this QR code'
                ], 403);
            }

            $qrInfo = [
                'qr_code' => $qrCode,
                'decoded_data' => $qrData,
                'is_expired' => $qrCode->expires_at && Carbon::now()->isAfter($qrCode->expires_at),
                'is_active' => $qrCode->status === QRCode::STATUS_ACTIVE,
                'job_order' => $qrCode->jobOrder,
                'available_steps' => $qrCode->jobOrder->processSteps()
                    ->whereDoesntHave('processes', function ($q) {
                        $q->where('status', 'completed');
                    })
                    ->get()
            ];

            return response()->json([
                'success' => true,
                'data' => $qrInfo
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get QR code information',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Regenerate QR code (Sales Manager/Admin)
     */
    public function regenerate(Request $request, $code): JsonResponse
    {
        $user = $request->user();

        if (!$user->isSalesManager() && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Sales managers and admins only.'
            ], 403);
        }

        $qrCode = QRCode::where('qr_data', $code)->first();

        if (!$qrCode) {
            return response()->json([
                'success' => false,
                'message' => 'QR code not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'reason' => 'nullable|string|max:255',
            'expires_in_hours' => 'nullable|integer|min:1|max:168', // Max 7 days
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Generate new QR code data
            $newQRData = $this->processService->generateQRData($qrCode->jobOrder);
            $expiresAt = $request->expires_in_hours 
                ? Carbon::now()->addHours($request->expires_in_hours)
                : Carbon::now()->addDays(7); // Default 7 days

            // Update the QR code
            $qrCode->update([
                'qr_data' => $newQRData,
                'expires_at' => $expiresAt,
                'status' => QRCode::STATUS_ACTIVE,
                'regenerated_at' => Carbon::now(),
                'regenerated_by' => $user->user_id,
                'regeneration_reason' => $request->reason
            ]);

            return response()->json([
                'success' => true,
                'message' => 'QR code regenerated successfully',
                'data' => [
                    'qr_code' => $qrCode->fresh(['jobOrder'])
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to regenerate QR code',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Deactivate QR code (Sales Manager/Admin)
     */
    public function deactivate(Request $request, $code): JsonResponse
    {
        $user = $request->user();

        if (!$user->isSalesManager() && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Sales managers and admins only.'
            ], 403);
        }

        $qrCode = QRCode::where('qr_data', $code)->first();

        if (!$qrCode) {
            return response()->json([
                'success' => false,
                'message' => 'QR code not found'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $qrCode->update([
                'status' => QRCode::STATUS_INACTIVE,
                'deactivated_at' => Carbon::now(),
                'deactivated_by' => $user->user_id,
                'deactivation_reason' => $request->reason
            ]);

            return response()->json([
                'success' => true,
                'message' => 'QR code deactivated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to deactivate QR code',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get QR code statistics (Sales Manager/Admin)
     */
    public function statistics(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isSalesManager() && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Sales managers and admins only.'
            ], 403);
        }

        $period = $request->get('period', 'month'); // week, month, year

        $baseQuery = QRCode::query();

        if ($period === 'week') {
            $baseQuery->where('created_at', '>=', Carbon::now()->subWeek());
        } elseif ($period === 'month') {
            $baseQuery->where('created_at', '>=', Carbon::now()->subMonth());
        } elseif ($period === 'year') {
            $baseQuery->where('created_at', '>=', Carbon::now()->subYear());
        }

        $statistics = [
            'total_qr_codes' => (clone $baseQuery)->count(),
            'active_qr_codes' => (clone $baseQuery)->where('status', QRCode::STATUS_ACTIVE)->count(),
            'inactive_qr_codes' => (clone $baseQuery)->where('status', QRCode::STATUS_INACTIVE)->count(),
            'expired_qr_codes' => (clone $baseQuery)->where('expires_at', '<', Carbon::now())->count(),
            'scanned_qr_codes' => (clone $baseQuery)->whereHas('jobOrder.processSteps.processes')->count(),
            'period' => $period,
            'generated_today' => QRCode::whereDate('created_at', Carbon::today())->count(),
            'most_scanned_orders' => QRCode::with(['jobOrder:job_order_id,title'])
                ->whereHas('jobOrder.processSteps.processes')
                ->get()
                ->groupBy('job_order_id')
                ->map(function ($group) {
                    return [
                        'job_order' => $group->first()->jobOrder,
                        'scan_count' => $group->first()->jobOrder->processSteps()
                            ->withCount('processes')
                            ->get()
                            ->sum('processes_count')
                    ];
                })
                ->sortByDesc('scan_count')
                ->take(5)
                ->values()
        ];

        return response()->json([
            'success' => true,
            'data' => $statistics
        ]);
    }

    /**
     * Bulk operations on QR codes (Admin only)
     */
    public function bulkOperation(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Admins only.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'operation' => 'required|in:deactivate,reactivate,delete',
            'qr_codes' => 'required|array|min:1',
            'qr_codes.*' => 'string',
            'reason' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $qrCodes = QRCode::whereIn('qr_data', $request->qr_codes)->get();
            $operation = $request->operation;
            $reason = $request->reason;
            $results = [];

            foreach ($qrCodes as $qrCode) {
                switch ($operation) {
                    case 'deactivate':
                        $qrCode->update([
                            'status' => QRCode::STATUS_INACTIVE,
                            'deactivated_at' => Carbon::now(),
                            'deactivated_by' => $user->user_id,
                            'deactivation_reason' => $reason
                        ]);
                        break;
                    
                    case 'reactivate':
                        $qrCode->update([
                            'status' => QRCode::STATUS_ACTIVE,
                            'deactivated_at' => null,
                            'deactivated_by' => null,
                            'deactivation_reason' => null
                        ]);
                        break;
                    
                    case 'delete':
                        $qrCode->delete();
                        break;
                }
                
                $results[] = [
                    'qr_code_id' => $qrCode->qr_code_id,
                    'operation' => $operation,
                    'success' => true
                ];
            }

            return response()->json([
                'success' => true,
                'message' => "Bulk {$operation} completed successfully",
                'data' => [
                    'processed_count' => count($results),
                    'results' => $results
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => "Bulk {$request->operation} failed",
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
