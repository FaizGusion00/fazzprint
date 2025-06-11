<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobOrder extends Model
{
    use HasFactory;

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'job_order_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'customer_id',
        'started_by',
        'status',
        'job_order_url',
        'title',
        'description',
        'quantity',
        'design_requirements',
        'special_instructions',
        'due_date',
        'estimated_price',
        'quoted_price',
        'final_price',
        'payment_status',
        'amount_paid',
        'balance_due',
        'payment_notes',
        'payment_due_date',
        'payment_confirmed_at',
        'payment_confirmed_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'due_date' => 'datetime',
        'payment_due_date' => 'datetime',
        'payment_confirmed_at' => 'datetime',
        'estimated_price' => 'decimal:2',
        'quoted_price' => 'decimal:2',
        'final_price' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'balance_due' => 'decimal:2',
    ];

    /**
     * Status constants
     */
    const STATUS_DRAFT = 'draft';
    const STATUS_STARTED = 'started';
    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';

    /**
     * Payment status constants
     */
    const PAYMENT_PENDING = 'pending';
    const PAYMENT_PARTIAL = 'partial';
    const PAYMENT_PAID = 'paid';
    const PAYMENT_REFUNDED = 'refunded';

    /**
     * Get the customer who created this job order
     */
    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id', 'user_id');
    }

    /**
     * Get the sales manager who started this job order
     */
    public function salesManager()
    {
        return $this->belongsTo(User::class, 'started_by', 'user_id');
    }

    /**
     * Get the process steps for this job order
     */
    public function processSteps()
    {
        return $this->hasMany(ProcessStep::class, 'job_order_id');
    }

    /**
     * Get the QR code for this job order
     */
    public function qrCode()
    {
        return $this->hasOne(QRCode::class, 'job_order_id');
    }

    /**
     * Get the notifications for this job order
     */
    public function notifications()
    {
        return $this->hasMany(Notification::class, 'job_order_id');
    }

    /**
     * Get the order tracking entries for this job order
     */
    public function orderTrackings()
    {
        return $this->hasMany(OrderTracking::class, 'job_order_id');
    }

    /**
     * Get the files uploaded for this job order
     */
    public function orderFiles()
    {
        return $this->hasMany(OrderFile::class, 'job_order_id');
    }

    /**
     * Check if the job order is in draft status
     */
    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    /**
     * Check if the job order is started
     */
    public function isStarted(): bool
    {
        return $this->status === self::STATUS_STARTED;
    }

    /**
     * Check if the job order is in progress
     */
    public function isInProgress(): bool
    {
        return $this->status === self::STATUS_IN_PROGRESS;
    }

    /**
     * Check if the job order is completed
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Generate a unique job order URL
     */
    public static function generateJobOrderUrl(): string
    {
        do {
            $url = 'JO-' . date('Ymd') . '-' . strtoupper(uniqid());
        } while (self::where('job_order_url', $url)->exists());

        return $url;
    }

    /**
     * Get the current progress percentage
     */
    public function getProgressPercentage(): int
    {
        $totalSteps = $this->processSteps()->count();
        if ($totalSteps === 0) {
            return 0;
        }

        $completedSteps = $this->processSteps()
            ->whereHas('processes', function ($query) {
                $query->where('status', 'completed');
            })
            ->count();

        return round(($completedSteps / $totalSteps) * 100);
    }

    /**
     * Get the payment confirmer user
     */
    public function paymentConfirmer()
    {
        return $this->belongsTo(User::class, 'payment_confirmed_by', 'user_id');
    }

    /**
     * Check if payment is pending
     */
    public function isPaymentPending(): bool
    {
        return $this->payment_status === self::PAYMENT_PENDING;
    }

    /**
     * Check if payment is completed
     */
    public function isPaymentCompleted(): bool
    {
        return $this->payment_status === self::PAYMENT_PAID;
    }

    /**
     * Check if payment is partial
     */
    public function isPaymentPartial(): bool
    {
        return $this->payment_status === self::PAYMENT_PARTIAL;
    }

    /**
     * Calculate balance due
     */
    public function calculateBalanceDue(): float
    {
        $finalPrice = $this->final_price ?? $this->quoted_price ?? $this->estimated_price ?? 0;
        return max(0, $finalPrice - $this->amount_paid);
    }

    /**
     * Check if order can be started (payment must be confirmed)
     */
    public function canBeStarted(): bool
    {
        return $this->isDraft() && $this->isPaymentCompleted();
    }

    /**
     * Check if order can be cancelled
     */
    public function canBeCancelled(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_STARTED]);
    }

    /**
     * Check if order can be edited
     */
    public function canBeEdited(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }
}
