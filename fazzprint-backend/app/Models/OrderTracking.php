<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderTracking extends Model
{
    use HasFactory;

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'tracking_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'job_order_id',
        'admin_id',
        'status',
        'location',
        'description',
        'progress_percentage',
        'estimated_completion',
        'actual_completion',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'progress_percentage' => 'integer',
        'estimated_completion' => 'datetime',
        'actual_completion' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Status constants
     */
    const STATUS_RECEIVED = 'received';
    const STATUS_DESIGN_REVIEW = 'design_review';
    const STATUS_PRODUCTION_QUEUE = 'production_queue';
    const STATUS_IN_PRODUCTION = 'in_production';
    const STATUS_QUALITY_CHECK = 'quality_check';
    const STATUS_PACKAGING = 'packaging';
    const STATUS_READY_FOR_PICKUP = 'ready_for_pickup';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    /**
     * Get the job order being tracked
     */
    public function jobOrder()
    {
        return $this->belongsTo(JobOrder::class, 'job_order_id', 'job_order_id');
    }

    /**
     * Get the admin who created this tracking entry
     */
    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id', 'user_id');
    }

    /**
     * Get the status display name
     */
    public function getStatusDisplayName(): string
    {
        return match($this->status) {
            self::STATUS_RECEIVED => 'Order Received',
            self::STATUS_DESIGN_REVIEW => 'Design Review',
            self::STATUS_PRODUCTION_QUEUE => 'Production Queue',
            self::STATUS_IN_PRODUCTION => 'In Production',
            self::STATUS_QUALITY_CHECK => 'Quality Check',
            self::STATUS_PACKAGING => 'Packaging',
            self::STATUS_READY_FOR_PICKUP => 'Ready for Pickup',
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_CANCELLED => 'Cancelled',
            default => 'Unknown Status'
        };
    }

    /**
     * Get the latest tracking entry for a job order
     */
    public static function getLatestForJobOrder($jobOrderId)
    {
        return self::where('job_order_id', $jobOrderId)
            ->latest()
            ->first();
    }

    /**
     * Create a new tracking entry
     */
    public static function createTrackingEntry($jobOrderId, $adminId, $status, $description, $progressPercentage = null)
    {
        return self::create([
            'job_order_id' => $jobOrderId,
            'admin_id' => $adminId,
            'status' => $status,
            'description' => $description,
            'progress_percentage' => $progressPercentage,
            'location' => 'Production Floor', // Default location
        ]);
    }

    /**
     * Check if status indicates completion
     */
    public function isCompleted(): bool
    {
        return in_array($this->status, [self::STATUS_COMPLETED, self::STATUS_CANCELLED]);
    }

    /**
     * Check if status indicates active production
     */
    public function isInProduction(): bool
    {
        return in_array($this->status, [
            self::STATUS_PRODUCTION_QUEUE,
            self::STATUS_IN_PRODUCTION,
            self::STATUS_QUALITY_CHECK,
            self::STATUS_PACKAGING
        ]);
    }
}
