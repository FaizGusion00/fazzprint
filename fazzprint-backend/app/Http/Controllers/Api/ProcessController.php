<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Process;
use App\Models\ProcessStep;
use App\Models\QRCode;
use App\Models\JobOrder;
use App\Services\ProcessManagementService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ProcessController extends Controller
{
    protected ProcessManagementService $processService;

    public function __construct(ProcessManagementService $processService)
    {
        $this->processService = $processService;
    }

    /**
     * Get user's active processes (Staff only)
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isStaff()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Staff only.'
            ], 403);
        }

        $processes = Process::where('pic_id', $user->user_id)
            ->whereIn('status', [Process::STATUS_ACTIVE, Process::STATUS_PAUSED])
            ->with([
                'processStep.jobOrder:job_order_id,title,quantity,status',
                'processStep.jobOrder.customer:user_id,full_name'
            ])
            ->orderBy('start_time', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'active_processes' => $processes,
                'total_count' => $processes->count()
            ]
        ]);
    }

    /**
     * Get available QR codes to scan (Staff only)
     */
    public function available(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isStaff()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Staff only.'
            ], 403);
        }

        $availableQRs = QRCode::where('status', QRCode::STATUS_ACTIVE)
            ->with([
                'jobOrder:job_order_id,title,quantity,status,customer_id',
                'jobOrder.customer:user_id,full_name',
                'jobOrder.processSteps' => function ($query) {
                    $query->whereDoesntHave('processes', function ($q) {
                        $q->where('status', Process::STATUS_COMPLETED);
                    });
                }
            ])
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'available_qr_codes' => $availableQRs,
                'count' => $availableQRs->count()
            ]
        ]);
    }

    /**
     * Scan QR code to start a process (Staff only)
     */
    public function scanQR(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isStaff()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Staff only.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'qr_data' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Validate QR code
            $qrCode = $this->processService->validateQRCode($request->qr_data);
            
            if (!$qrCode) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or expired QR code'
                ], 422);
            }

            // Get the job order and available process steps
            $jobOrder = $qrCode->jobOrder;
            $availableSteps = $jobOrder->processSteps()
                ->whereDoesntHave('processes', function ($q) {
                    $q->where('status', Process::STATUS_COMPLETED);
                })
                ->get();

            if ($availableSteps->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No available process steps for this order'
                ], 422);
            }

            return response()->json([
                'success' => true,
                'message' => 'QR code scanned successfully',
                'data' => [
                    'job_order' => $jobOrder->load(['customer:user_id,full_name']),
                    'available_steps' => $availableSteps,
                    'qr_code' => $qrCode
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'QR code scan failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Start a specific process step (Staff only)
     */
    public function startProcess(Request $request, $processStepId): JsonResponse
    {
        $user = $request->user();

        if (!$user->isStaff()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Staff only.'
            ], 403);
        }

        $processStep = ProcessStep::find($processStepId);

        if (!$processStep) {
            return response()->json([
                'success' => false,
                'message' => 'Process step not found'
            ], 404);
        }

        // Check if step already has a completed process
        if ($processStep->processes()->where('status', Process::STATUS_COMPLETED)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'This process step is already completed'
            ], 422);
        }

        // Check if user already has an active process for this step
        $existingProcess = $processStep->processes()
            ->where('pic_id', $user->user_id)
            ->whereIn('status', [Process::STATUS_ACTIVE, Process::STATUS_PAUSED])
            ->first();

        if ($existingProcess) {
            return response()->json([
                'success' => false,
                'message' => 'You already have an active process for this step',
                'data' => ['existing_process' => $existingProcess]
            ], 422);
        }

        try {
            $process = $this->processService->startProcess($processStep, $user);

            return response()->json([
                'success' => true,
                'message' => 'Process started successfully',
                'data' => [
                    'process' => $process->load(['processStep.jobOrder'])
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to start process',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Pause a running process
     */
    public function pauseProcess(Request $request, $processId): JsonResponse
    {
        $user = $request->user();
        $process = Process::find($processId);

        if (!$process) {
            return response()->json([
                'success' => false,
                'message' => 'Process not found'
            ], 404);
        }

        if ($process->pic_id !== $user->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. You can only manage your own processes.'
            ], 403);
        }

        if ($process->status !== Process::STATUS_ACTIVE) {
            return response()->json([
                'success' => false,
                'message' => 'Process is not currently active'
            ], 422);
        }

        try {
            $this->processService->pauseProcess($process);

            return response()->json([
                'success' => true,
                'message' => 'Process paused successfully',
                'data' => [
                    'process' => $process->fresh()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to pause process',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Resume a paused process
     */
    public function resumeProcess(Request $request, $processId): JsonResponse
    {
        $user = $request->user();
        $process = Process::find($processId);

        if (!$process) {
            return response()->json([
                'success' => false,
                'message' => 'Process not found'
            ], 404);
        }

        if ($process->pic_id !== $user->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. You can only manage your own processes.'
            ], 403);
        }

        if ($process->status !== Process::STATUS_PAUSED) {
            return response()->json([
                'success' => false,
                'message' => 'Process is not currently paused'
            ], 422);
        }

        try {
            $this->processService->resumeProcess($process);

            return response()->json([
                'success' => true,
                'message' => 'Process resumed successfully',
                'data' => [
                    'process' => $process->fresh()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to resume process',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Complete a process with quantity and quality data
     */
    public function completeProcess(Request $request, $processId): JsonResponse
    {
        $user = $request->user();
        $process = Process::find($processId);

        if (!$process) {
            return response()->json([
                'success' => false,
                'message' => 'Process not found'
            ], 404);
        }

        if ($process->pic_id !== $user->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. You can only manage your own processes.'
            ], 403);
        }

        if (!in_array($process->status, [Process::STATUS_ACTIVE, Process::STATUS_PAUSED])) {
            return response()->json([
                'success' => false,
                'message' => 'Process is not in a completable state'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'quantity_completed' => 'required|integer|min:0',
            'quality_notes' => 'nullable|string|max:1000',
            'completion_remarks' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $this->processService->completeProcess(
                $process,
                $request->quantity_completed,
                $request->quality_notes,
                $request->completion_remarks
            );

            return response()->json([
                'success' => true,
                'message' => 'Process completed successfully',
                'data' => [
                    'process' => $process->fresh(['processStep.jobOrder'])
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to complete process',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get real-time process status and timer info
     */
    public function getProcessStatus(Request $request, $processId): JsonResponse
    {
        $user = $request->user();
        $process = Process::with(['processStep.jobOrder'])->find($processId);

        if (!$process) {
            return response()->json([
                'success' => false,
                'message' => 'Process not found'
            ], 404);
        }

        if ($process->pic_id !== $user->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. You can only view your own processes.'
            ], 403);
        }

        $statusInfo = [
            'process' => $process,
            'current_time' => Carbon::now(),
            'elapsed_time_seconds' => $process->getElapsedTimeAttribute(),
            'elapsed_time_formatted' => $process->getFormattedElapsedTime(),
            'is_running' => $process->status === Process::STATUS_ACTIVE,
            'can_pause' => $process->status === Process::STATUS_ACTIVE,
            'can_resume' => $process->status === Process::STATUS_PAUSED,
            'can_complete' => in_array($process->status, [Process::STATUS_ACTIVE, Process::STATUS_PAUSED]),
        ];

        return response()->json([
            'success' => true,
            'data' => $statusInfo
        ]);
    }

    /**
     * Update quantity completed (for partial completion tracking)
     */
    public function updateQuantity(Request $request, $processId): JsonResponse
    {
        $user = $request->user();
        $process = Process::find($processId);

        if (!$process) {
            return response()->json([
                'success' => false,
                'message' => 'Process not found'
            ], 404);
        }

        if ($process->pic_id !== $user->user_id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. You can only manage your own processes.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'quantity_completed' => 'required|integer|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $process->update([
                'quantity_completed' => $request->quantity_completed,
                'quality_notes' => $request->notes ?: $process->quality_notes,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Quantity updated successfully',
                'data' => [
                    'process' => $process->fresh()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update quantity',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get staff's current tasks (Staff dashboard)
     */
    public function myTasks(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isStaff()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Staff only.'
            ], 403);
        }

        $activeProcesses = Process::where('pic_id', $user->user_id)
            ->whereIn('status', [Process::STATUS_ACTIVE, Process::STATUS_PAUSED])
            ->with(['processStep.jobOrder.customer'])
            ->get();

        $availableWork = QRCode::where('status', QRCode::STATUS_ACTIVE)
            ->whereHas('jobOrder.processSteps', function ($query) {
                $query->whereDoesntHave('processes', function ($q) {
                    $q->where('status', Process::STATUS_COMPLETED);
                });
            })
            ->with(['jobOrder.customer'])
            ->limit(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'active_processes' => $activeProcesses,
                'available_work' => $availableWork,
                'summary' => [
                    'active_count' => $activeProcesses->count(),
                    'available_count' => $availableWork->count(),
                    'total_active_time' => $activeProcesses->sum('elapsed_time')
                ]
            ]
        ]);
    }

    /**
     * Get staff's work history
     */
    public function workHistory(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isStaff()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Staff only.'
            ], 403);
        }

        $page = $request->get('page', 1);
        $perPage = $request->get('per_page', 20);

        $history = Process::where('pic_id', $user->user_id)
            ->with(['processStep.jobOrder.customer'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $history
        ]);
    }

    /**
     * Assign staff to a process step (Sales Manager/Admin)
     */
    public function assignStaff(Request $request, $orderId): JsonResponse
    {
        $user = $request->user();

        if (!$user->isSalesManager() && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Sales managers and admins only.'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'staff_id' => 'required|exists:users,user_id',
            'process_step_id' => 'required|exists:process_steps,process_step_id',
            'priority' => 'nullable|integer|min:1|max:5',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Implementation would be added here
        return response()->json([
            'success' => true,
            'message' => 'Staff assignment feature coming soon'
        ]);
    }

    /**
     * Get staff performance metrics (Sales Manager/Admin)
     */
    public function staffPerformance(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user->isSalesManager() && !$user->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Sales managers and admins only.'
            ], 403);
        }

        $period = $request->get('period', 'week'); // week, month, year

        $performance = DB::table('processes')
            ->join('users', 'processes.pic_id', '=', 'users.user_id')
            ->select([
                'users.user_id',
                'users.full_name',
                DB::raw('COUNT(processes.process_id) as total_processes'),
                DB::raw('SUM(processes.quantity_completed) as total_quantity'),
                DB::raw('AVG(processes.elapsed_time) as avg_time_per_process'),
                DB::raw('SUM(processes.elapsed_time) as total_time_worked')
            ])
            ->where('users.role', 'staff')
            ->where('processes.status', Process::STATUS_COMPLETED)
            ->when($period === 'week', function ($query) {
                return $query->where('processes.created_at', '>=', Carbon::now()->subWeek());
            })
            ->when($period === 'month', function ($query) {
                return $query->where('processes.created_at', '>=', Carbon::now()->subMonth());
            })
            ->when($period === 'year', function ($query) {
                return $query->where('processes.created_at', '>=', Carbon::now()->subYear());
            })
            ->groupBy('users.user_id', 'users.full_name')
            ->orderBy('total_processes', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'performance_metrics' => $performance,
                'period' => $period,
                'summary' => [
                    'total_staff' => $performance->count(),
                    'total_processes' => $performance->sum('total_processes'),
                    'total_quantity' => $performance->sum('total_quantity'),
                    'avg_efficiency' => $performance->avg('avg_time_per_process')
                ]
            ]
        ]);
    }
}
