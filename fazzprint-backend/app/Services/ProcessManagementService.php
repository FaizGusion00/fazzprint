<?php

namespace App\Services;

use App\Models\JobOrder;
use App\Models\ProcessStep;
use App\Models\Process;
use App\Models\QRCode;
use App\Models\Notification;
use App\Models\OrderTracking;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

/**
 * Process Management Service
 * 
 * This service handles the core automation logic for the FazzPrint ERP system
 * including order processing, status updates, notifications, and workflow management.
 */
class ProcessManagementService
{
    /**
     * Create a new job order from customer
     */
    public function createJobOrder(User $customer, array $orderData): JobOrder
    {
        return DB::transaction(function () use ($customer, $orderData) {
            // Generate unique job order URL
            $jobOrderUrl = JobOrder::generateJobOrderUrl();

            // Calculate estimated price (for reference only - sales manager will set actual price)
            $estimatedPrice = $this->calculateEstimatedPrice($orderData);

            // Create the job order
            $jobOrder = JobOrder::create([
                'customer_id' => $customer->user_id,
                'job_order_url' => $jobOrderUrl,
                'title' => $orderData['title'],
                'description' => $orderData['description'],
                'quantity' => $orderData['quantity'],
                'design_requirements' => $orderData['design_requirements'] ?? null,
                'special_instructions' => $orderData['special_instructions'] ?? null,
                'due_date' => $orderData['due_date'] ?? null,
                'estimated_price' => $estimatedPrice, // Reference price only
                'payment_status' => JobOrder::PAYMENT_PENDING,
                'amount_paid' => 0.00,
                'balance_due' => null, // Will be set when sales manager provides quoted price
                'status' => JobOrder::STATUS_DRAFT,
            ]);

            // Create default process steps
            $this->createDefaultProcessSteps($jobOrder);

            // Create initial order tracking
            OrderTracking::createTrackingEntry(
                $jobOrder->job_order_id,
                null,
                OrderTracking::STATUS_RECEIVED,
                'Order has been received and is under review.',
                10
            );

            // Send notification to customer
            $this->sendOrderCreatedNotification($jobOrder);

            // Notify sales managers about new order
            $this->notifySalesManagersNewOrder($jobOrder);

            Log::info('New job order created', ['job_order_id' => $jobOrder->job_order_id, 'customer_id' => $customer->user_id]);

            return $jobOrder;
        });
    }

    /**
     * Start a job order (Sales Manager action)
     */
    public function startJobOrder(JobOrder $jobOrder, User $salesManager): void
    {
        DB::transaction(function () use ($jobOrder, $salesManager) {
            // Update job order status
            $jobOrder->update([
                'status' => JobOrder::STATUS_STARTED,
                'started_by' => $salesManager->user_id,
            ]);

            // Generate QR Code
            $this->generateQRCode($jobOrder);

            // Update order tracking
            OrderTracking::createTrackingEntry(
                $jobOrder->job_order_id,
                $salesManager->user_id,
                OrderTracking::STATUS_PRODUCTION_QUEUE,
                'Order has been approved and added to production queue.',
                25
            );

            // Send notifications
            $this->sendOrderStartedNotification($jobOrder);

            Log::info('Job order started', ['job_order_id' => $jobOrder->job_order_id, 'started_by' => $salesManager->user_id]);
        });
    }

    /**
     * Start a process step (Staff action)
     */
    public function startProcess(ProcessStep $processStep, User $staff, int $startQuantity): Process
    {
        return DB::transaction(function () use ($processStep, $staff, $startQuantity) {
            // Create new process entry
            $process = Process::create([
                'process_step_id' => $processStep->process_step_id,
                'pic_id' => $staff->user_id,
                'status' => Process::STATUS_IN_PROGRESS,
                'start_time' => now(),
                'start_quantity' => $startQuantity,
                'staff_name' => $staff->full_name,
            ]);

            // Update job order status if this is the first step
            $this->updateJobOrderProgress($processStep->jobOrder);

            // Send notifications
            $this->sendProcessStartedNotification($process);

            Log::info('Process started', ['process_id' => $process->process_id, 'staff_id' => $staff->user_id]);

            return $process;
        });
    }

    /**
     * Complete a process step (Staff action)
     */
    public function completeProcess(Process $process, int $endQuantity, int $rejectQuantity = 0, string $remark = null): void
    {
        DB::transaction(function () use ($process, $endQuantity, $rejectQuantity, $remark) {
            // Complete the process
            $process->complete($endQuantity, $rejectQuantity, $remark);

            // Update job order progress
            $jobOrder = $process->processStep->jobOrder;
            $this->updateJobOrderProgress($jobOrder);

            // Check if all steps are completed
            if ($this->areAllStepsCompleted($jobOrder)) {
                $this->completeJobOrder($jobOrder);
            }

            // Send notifications
            $this->sendProcessCompletedNotification($process);

            Log::info('Process completed', ['process_id' => $process->process_id]);
        });
    }

    /**
     * Generate QR Code for job order
     */
    public function generateQRCode(JobOrder $jobOrder): QRCode
    {
        $qrData = QRCode::generateQRData($jobOrder->job_order_id);
        
        return QRCode::create([
            'job_order_id' => $jobOrder->job_order_id,
            'qr_code_data' => $qrData,
            'is_active' => true,
        ]);
    }

    /**
     * Create default process steps for a job order
     */
    private function createDefaultProcessSteps(JobOrder $jobOrder): void
    {
        $defaultSteps = [
            ['step_name' => 'Design Preparation', 'step_description' => 'Prepare and review design files', 'step_order' => 1, 'estimated_duration' => 60],
            ['step_name' => 'Material Preparation', 'step_description' => 'Prepare materials and setup', 'step_order' => 2, 'estimated_duration' => 30],
            ['step_name' => 'Printing', 'step_description' => 'Print the design on materials', 'step_order' => 3, 'estimated_duration' => 120],
            ['step_name' => 'Quality Control', 'step_description' => 'Check quality and finish', 'step_order' => 4, 'estimated_duration' => 30],
            ['step_name' => 'Packaging', 'step_description' => 'Package the finished products', 'step_order' => 5, 'estimated_duration' => 20],
        ];

        foreach ($defaultSteps as $step) {
            ProcessStep::create(array_merge($step, ['job_order_id' => $jobOrder->job_order_id]));
        }
    }

    /**
     * Update job order progress based on completed steps
     */
    private function updateJobOrderProgress(JobOrder $jobOrder): void
    {
        $totalSteps = $jobOrder->processSteps()->count();
        $completedSteps = $jobOrder->processSteps()
            ->whereHas('processes', function ($query) {
                $query->where('status', Process::STATUS_COMPLETED);
            })
            ->count();

        $progressPercentage = $totalSteps > 0 ? round(($completedSteps / $totalSteps) * 100) : 0;

        // Update job order status based on progress
        if ($progressPercentage > 0 && $progressPercentage < 100) {
            $jobOrder->update(['status' => JobOrder::STATUS_IN_PROGRESS]);
            
            // Update order tracking
            OrderTracking::createTrackingEntry(
                $jobOrder->job_order_id,
                null,
                OrderTracking::STATUS_IN_PRODUCTION,
                "Production in progress. {$completedSteps} of {$totalSteps} steps completed.",
                25 + ($progressPercentage * 0.7) // 25% base + 70% for production
            );
        }
    }

    /**
     * Check if all process steps are completed
     */
    private function areAllStepsCompleted(JobOrder $jobOrder): bool
    {
        $totalSteps = $jobOrder->processSteps()->count();
        $completedSteps = $jobOrder->processSteps()
            ->whereHas('processes', function ($query) {
                $query->where('status', Process::STATUS_COMPLETED);
            })
            ->count();

        return $totalSteps > 0 && $totalSteps === $completedSteps;
    }

    /**
     * Complete a job order
     */
    private function completeJobOrder(JobOrder $jobOrder): void
    {
        $jobOrder->update(['status' => JobOrder::STATUS_COMPLETED]);

        // Create final tracking entry
        OrderTracking::createTrackingEntry(
            $jobOrder->job_order_id,
            null,
            OrderTracking::STATUS_COMPLETED,
            'Order has been completed and is ready for pickup.',
            100
        );

        // Deactivate QR code
        $jobOrder->qrCode?->deactivate();

        // Send completion notification
        $this->sendOrderCompletedNotification($jobOrder);
    }

    /**
     * Send order created notification
     */
    private function sendOrderCreatedNotification(JobOrder $jobOrder): void
    {
        Notification::createOrderNotification(
            $jobOrder->customer_id,
            $jobOrder->job_order_id,
            Notification::TYPE_ORDER_CREATED,
            'Order Created Successfully',
            "Your order '{$jobOrder->title}' has been created and is under review. Order ID: {$jobOrder->job_order_url}"
        );
    }

    /**
     * Send order started notification
     */
    private function sendOrderStartedNotification(JobOrder $jobOrder): void
    {
        Notification::createOrderNotification(
            $jobOrder->customer_id,
            $jobOrder->job_order_id,
            Notification::TYPE_ORDER_STARTED,
            'Order Started',
            "Your order '{$jobOrder->title}' has been approved and production will begin soon. Order ID: {$jobOrder->job_order_url}"
        );
    }

    /**
     * Send order completed notification
     */
    private function sendOrderCompletedNotification(JobOrder $jobOrder): void
    {
        Notification::createOrderNotification(
            $jobOrder->customer_id,
            $jobOrder->job_order_id,
            Notification::TYPE_ORDER_COMPLETED,
            'Order Completed',
            "Your order '{$jobOrder->title}' has been completed and is ready for pickup. Order ID: {$jobOrder->job_order_url}"
        );
    }

    /**
     * Send process started notification
     */
    private function sendProcessStartedNotification(Process $process): void
    {
        $jobOrder = $process->processStep->jobOrder;
        
        Notification::createOrderNotification(
            $jobOrder->customer_id,
            $jobOrder->job_order_id,
            Notification::TYPE_PROCESS_STARTED,
            'Production Update',
            "Work has started on '{$process->processStep->step_name}' for your order '{$jobOrder->title}'"
        );
    }

    /**
     * Send process completed notification
     */
    private function sendProcessCompletedNotification(Process $process): void
    {
        $jobOrder = $process->processStep->jobOrder;
        
        Notification::createOrderNotification(
            $jobOrder->customer_id,
            $jobOrder->job_order_id,
            Notification::TYPE_PROCESS_COMPLETED,
            'Production Update',
            "'{$process->processStep->step_name}' has been completed for your order '{$jobOrder->title}'"
        );
    }

    /**
     * Notify sales managers about new order
     */
    private function notifySalesManagersNewOrder(JobOrder $jobOrder): void
    {
        $salesManagers = User::where('role', User::ROLE_SALES_MANAGER)->get();
        
        foreach ($salesManagers as $salesManager) {
            Notification::createOrderNotification(
                $salesManager->user_id,
                $jobOrder->job_order_id,
                Notification::TYPE_ORDER_CREATED,
                'New Order Received',
                "A new order '{$jobOrder->title}' has been received from {$jobOrder->customer->full_name}. Order ID: {$jobOrder->job_order_url}"
            );
        }
    }

    /**
     * Get job order by QR code data
     */
    public function getJobOrderByQRCode(string $qrData): ?JobOrder
    {
        $decodedData = QRCode::decodeQRData($qrData);
        
        if (!$decodedData || !isset($decodedData['job_order_id'])) {
            return null;
        }

        return JobOrder::find($decodedData['job_order_id']);
    }

    /**
     * Get real-time status for customer tracking
     */
    public function getOrderStatus(JobOrder $jobOrder): array
    {
        $latestTracking = OrderTracking::getLatestForJobOrder($jobOrder->job_order_id);
        $processSteps = $jobOrder->processSteps()->with(['processes' => function ($query) {
            $query->latest();
        }])->orderBy('step_order')->get();

        $currentStep = null;
        $nextStep = null;

        foreach ($processSteps as $index => $step) {
            if ($step->isInProgress()) {
                $currentStep = $step;
                $nextStep = $processSteps[$index + 1] ?? null;
                break;
            } elseif ($step->isPending()) {
                $nextStep = $step;
                break;
            }
        }

        return [
            'job_order' => $jobOrder,
            'latest_tracking' => $latestTracking,
            'process_steps' => $processSteps,
            'current_step' => $currentStep,
            'next_step' => $nextStep,
            'progress_percentage' => $jobOrder->getProgressPercentage(),
            'estimated_completion' => $latestTracking?->estimated_completion,
        ];
    }

    /**
     * Calculate estimated price for an order (REFERENCE ONLY)
     * Sales manager will determine the actual quoted price based on:
     * - Complexity of design
     * - Rush orders
     * - Special materials
     * - Customer negotiations
     * This is just to give customer a rough idea of pricing
     */
    private function calculateEstimatedPrice(array $orderData): float
    {
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

        $quantity = $orderData['quantity'] ?? 1;
        $title = strtolower($orderData['title'] ?? '');
        
        // Determine if this is t-shirt printing or paper printing
        if (strpos($title, 'shirt') !== false || strpos($title, 'tshirt') !== false || strpos($title, 'apparel') !== false) {
            // T-shirt printing pricing
            $basePrice = $tshirtPrices['custom']; // Default to custom t-shirt price
            
            // Simple complexity detection based on description
            $description = strtolower($orderData['description'] ?? '');
            if (strpos($description, 'simple') !== false || strpos($description, 'basic') !== false) {
                $basePrice = $tshirtPrices['basic'];
            } elseif (strpos($description, 'complex') !== false || strpos($description, 'detailed') !== false) {
                $basePrice = $tshirtPrices['premium'];
            }
            
            $totalCost = $basePrice * $quantity;
            
            // Volume discounts for t-shirts
            if ($quantity >= 50) {
                $totalCost *= 0.85; // 15% discount for 50+
            } elseif ($quantity >= 20) {
                $totalCost *= 0.90; // 10% discount for 20+
            } elseif ($quantity >= 10) {
                $totalCost *= 0.95; // 5% discount for 10+
            }
            
        } else {
            // Paper printing pricing - default to A4
            $basePrice = $basePrices['A4'];
            
            // Detect if color printing is needed
            $colorMultiplier = 1.0;
            $description = strtolower($orderData['description'] ?? '');
            if (strpos($description, 'color') !== false || strpos($description, 'colour') !== false) {
                $colorMultiplier = 3.0; // Color printing is 3x more expensive
            }
            
            $costPerPage = $basePrice * $colorMultiplier;
            $totalCost = $costPerPage * $quantity;
            
            // Volume discounts for paper printing
            if ($quantity >= 1000) {
                $totalCost *= 0.85; // 15% discount
            } elseif ($quantity >= 500) {
                $totalCost *= 0.90; // 10% discount
            } elseif ($quantity >= 100) {
                $totalCost *= 0.95; // 5% discount
            }
        }

        // Ensure minimum price
        return max(10.00, round($totalCost, 2)); // Minimum RM 10
    }
} 