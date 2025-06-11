<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'notification_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'recipient_id',
        'job_order_id',
        'type',
        'title',
        'message',
        'is_read',
        'sent_at',
        'email_sent',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'is_read' => 'boolean',
        'email_sent' => 'boolean',
        'sent_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'notifications';

    /**
     * Notification type constants
     */
    const TYPE_ORDER_CREATED = 'order_created';
    const TYPE_ORDER_STARTED = 'order_started';
    const TYPE_ORDER_IN_PROGRESS = 'order_in_progress';
    const TYPE_ORDER_COMPLETED = 'order_completed';
    const TYPE_PROCESS_STARTED = 'process_started';
    const TYPE_PROCESS_COMPLETED = 'process_completed';
    const TYPE_GENERAL = 'general';

    /**
     * Get the recipient user
     */
    public function recipient()
    {
        return $this->belongsTo(User::class, 'recipient_id', 'user_id');
    }

    /**
     * Get the related job order
     */
    public function jobOrder()
    {
        return $this->belongsTo(JobOrder::class, 'job_order_id', 'job_order_id');
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(): void
    {
        $this->update(['is_read' => true]);
    }

    /**
     * Mark notification as email sent
     */
    public function markEmailSent(): void
    {
        $this->update(['email_sent' => true]);
    }

    /**
     * Scope for unread notifications
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * Scope for notifications by type
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Create notification for order status change
     */
    public static function createOrderNotification($recipientId, $jobOrderId, $type, $title, $message)
    {
        return self::create([
            'recipient_id' => $recipientId,
            'job_order_id' => $jobOrderId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'sent_at' => now(),
        ]);
    }
}
