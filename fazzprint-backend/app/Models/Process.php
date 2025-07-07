<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Process extends Model
{
    use HasFactory;

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'process_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'process_step_id',
        'pic_id',
        'status',
        'start_time',
        'end_time',
        'start_quantity',
        'end_quantity',
        'reject_quantity',
        'remark',
        'staff_name',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'start_quantity' => 'integer',
        'end_quantity' => 'integer',
        'reject_quantity' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Status constants
     */
    const STATUS_PENDING = 'pending';
    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_COMPLETED = 'completed';
    const STATUS_PAUSED = 'paused';
    const STATUS_CANCELLED = 'cancelled';
    // Add this for compatibility with controller usage
    const STATUS_ACTIVE = self::STATUS_IN_PROGRESS;

    /**
     * Get the process step that owns this process
     */
    public function processStep()
    {
        return $this->belongsTo(ProcessStep::class, 'process_step_id', 'process_step_id');
    }

    /**
     * Get the staff member (PIC) responsible for this process
     */
    public function staff()
    {
        return $this->belongsTo(User::class, 'pic_id', 'user_id');
    }

    /**
     * Check if the process is in progress
     */
    public function isInProgress(): bool
    {
        return $this->status === self::STATUS_IN_PROGRESS;
    }

    /**
     * Check if the process is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Check if the process is pending
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Start the process
     */
    public function start(): void
    {
        $this->update([
            'status' => self::STATUS_IN_PROGRESS,
            'start_time' => now(),
        ]);
    }

    /**
     * Complete the process
     */
    public function complete(int $endQuantity, int $rejectQuantity = 0, string $remark = null): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'end_time' => now(),
            'end_quantity' => $endQuantity,
            'reject_quantity' => $rejectQuantity,
            'remark' => $remark,
        ]);
    }

    /**
     * Pause the process
     */
    public function pause(): void
    {
        $this->update([
            'status' => self::STATUS_PAUSED,
        ]);
    }

    /**
     * Resume the process
     */
    public function resume(): void
    {
        $this->update([
            'status' => self::STATUS_IN_PROGRESS,
        ]);
    }

    /**
     * Get the duration of the process in minutes
     */
    public function getDurationInMinutes(): ?int
    {
        if (!$this->start_time) {
            return null;
        }

        $endTime = $this->end_time ?? now();
        return $this->start_time->diffInMinutes($endTime);
    }

    /**
     * Get the duration in human readable format
     */
    public function getDurationForHumans(): string
    {
        if (!$this->start_time) {
            return 'Not started';
        }

        $endTime = $this->end_time ?? now();
        return $this->start_time->diffForHumans($endTime, true);
    }

    /**
     * Get the good quantity (end_quantity - reject_quantity)
     */
    public function getGoodQuantity(): int
    {
        return ($this->end_quantity ?? 0) - ($this->reject_quantity ?? 0);
    }

    /**
     * Calculate the processing rate (good quantity per hour)
     */
    public function getProcessingRate(): ?float
    {
        $duration = $this->getDurationInMinutes();
        $goodQuantity = $this->getGoodQuantity();

        if (!$duration || $duration === 0 || !$goodQuantity) {
            return null;
        }

        return round(($goodQuantity / $duration) * 60, 2); // per hour
    }

    /**
     * Check if the process is currently running (considering database persistence)
     */
    public function isCurrentlyRunning(): bool
    {
        return $this->status === self::STATUS_IN_PROGRESS && $this->start_time && !$this->end_time;
    }

    /**
     * Get elapsed time since start (even if browser is closed)
     */
    public function getElapsedTime(): ?string
    {
        if (!$this->start_time || !$this->isCurrentlyRunning()) {
            return null;
        }

        return $this->start_time->diffForHumans(now(), true);
    }
}
