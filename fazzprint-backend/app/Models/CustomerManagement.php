<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CustomerManagement extends Model
{
    use HasFactory;

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'customer_management_id';

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'customer_management';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'customer_id',
        'admin_id',
        'total_orders',
        'total_spent',
        'last_order_date',
        'customer_status',
        'notes',
        'preferred_contact_method',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'total_orders' => 'integer',
        'total_spent' => 'decimal:2',
        'last_order_date' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Customer status constants
     */
    const STATUS_ACTIVE = 'active';
    const STATUS_INACTIVE = 'inactive';
    const STATUS_VIP = 'vip';
    const STATUS_BLOCKED = 'blocked';

    /**
     * Get the customer
     */
    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id', 'user_id');
    }

    /**
     * Get the admin managing this customer
     */
    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id', 'user_id');
    }

    /**
     * Update customer statistics
     */
    public function updateStatistics()
    {
        $jobOrders = $this->customer->jobOrders()
            ->where('status', '!=', 'cancelled')
            ->get();

        $this->update([
            'total_orders' => $jobOrders->count(),
            'total_spent' => $jobOrders->sum('quantity') * 10, // Assuming $10 per item
            'last_order_date' => $jobOrders->max('created_at'),
        ]);
    }

    /**
     * Check if customer is VIP
     */
    public function isVIP(): bool
    {
        return $this->customer_status === self::STATUS_VIP;
    }

    /**
     * Check if customer is active
     */
    public function isActive(): bool
    {
        return $this->customer_status === self::STATUS_ACTIVE;
    }
}
