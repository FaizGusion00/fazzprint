<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderTracking;
use App\Models\JobOrder;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TrackingController extends Controller
{
    /**
     * Search for orders by tracking_id, order_id, or order_url
     */
    public function search(Request $request): JsonResponse
    {
        $code = $request->get('code');
        
        if (empty($code)) {
            return response()->json([
                'success' => false,
                'message' => 'Search code is required'
            ], 400);
        }

        // First, try to find by tracking_id in order_trackings table
        $tracking = OrderTracking::with([
            'jobOrder.customer:user_id,full_name,email',
            'jobOrder.salesManager:user_id,full_name',
            'jobOrder.orderFiles'
        ])->find($code);

        if ($tracking) {
            // Found by tracking_id
            $jobOrder = $tracking->jobOrder;
            
            // Get all tracking history for this order
            $trackingHistory = OrderTracking::where('job_order_id', $jobOrder->job_order_id)
                ->orderBy('created_at', 'asc')
                ->get();

            return $this->buildTrackingResponse($jobOrder, $trackingHistory);
        }

        // If not found by tracking_id, try by job_order_id
        if (is_numeric($code)) {
            $jobOrder = JobOrder::with([
                'customer:user_id,full_name,email',
                'salesManager:user_id,full_name',
                'orderFiles',
                'orderTrackings' => function ($q) {
                    $q->orderBy('created_at', 'asc');
                }
            ])->find($code);

            if ($jobOrder) {
                return $this->buildTrackingResponse($jobOrder, $jobOrder->orderTrackings);
            }
        }

        // Try by job_order_url
        $jobOrder = JobOrder::with([
            'customer:user_id,full_name,email',
            'salesManager:user_id,full_name',
            'orderFiles',
            'orderTrackings' => function ($q) {
                $q->orderBy('created_at', 'asc');
            }
        ])->where('job_order_url', $code)->first();

        if ($jobOrder) {
            return $this->buildTrackingResponse($jobOrder, $jobOrder->orderTrackings);
        }

        return response()->json([
            'success' => false,
            'message' => 'Order not found with the provided tracking code'
        ], 404);
    }

    /**
     * Build tracking response with proper format
     */
    private function buildTrackingResponse(JobOrder $jobOrder, $trackingHistory): JsonResponse
    {
        // Calculate progress
        $latestTracking = $trackingHistory->last();
        $progress = [
            'percentage' => $latestTracking ? $latestTracking->progress_percentage : 10,
            'current_status' => $jobOrder->status,
            'completed_steps' => $trackingHistory->where('progress_percentage', '>=', 100)->count(),
            'total_steps' => $trackingHistory->count(),
            'estimated_completion' => $latestTracking ? $latestTracking->estimated_completion : null
        ];

        // Format tracking history
        $formattedHistory = $trackingHistory->map(function ($tracking) {
            return [
                'tracking_id' => $tracking->tracking_id,
                'event' => $tracking->getStatusDisplayName(),
                'status' => $tracking->status,
                'timestamp' => $tracking->created_at,
                'description' => $tracking->description,
                'progress_percentage' => $tracking->progress_percentage,
                'location' => $tracking->location,
                'notes' => $tracking->notes
            ];
        });

        // Get next steps
        $nextSteps = $this->getNextSteps($jobOrder);

        return response()->json([
            'success' => true,
            'data' => [
                'job_order' => $jobOrder,
                'tracking_history' => $formattedHistory,
                'progress' => $progress,
                'next_steps' => $nextSteps,
                'can_cancel' => $jobOrder->status === 'draft'
            ]
        ]);
    }

    /**
     * Get next steps for an order
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
            // Get upcoming tracking stages
            $completedStatuses = $jobOrder->orderTrackings->pluck('status')->toArray();
            $allStatuses = [
                'design_review' => 'Design Review',
                'production_queue' => 'Production Queue', 
                'in_production' => 'In Production',
                'quality_check' => 'Quality Check',
                'packaging' => 'Packaging',
                'ready_for_pickup' => 'Ready for Pickup'
            ];

            foreach ($allStatuses as $status => $name) {
                if (!in_array($status, $completedStatuses)) {
                    $nextSteps[] = [
                        'step' => $name,
                        'description' => 'Upcoming production step',
                        'estimated_time' => '2-4 hours'
                    ];
                    
                    if (count($nextSteps) >= 3) break;
                }
            }
        }

        return $nextSteps;
    }
} 