<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Storage;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'user_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_name',
        'full_name',
        'email',
        'phone_number',
        'address',
        'password',
        'role',
        'settings',
        'profile_image',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be appended to the model's array and JSON representation.
     *
     * @var array
     */
    protected $appends = [
        'profile_image_url',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => 'string',
            'settings' => 'array',
        ];
    }

    /**
     * Get the profile image URL attribute.
     *
     * @return string|null
     */
    public function getProfileImageUrlAttribute(): ?string
    {
        if (!$this->profile_image) {
            return null;
        }

        // If profile_image is already a full URL, return it as is
        if (str_starts_with($this->profile_image, 'http')) {
            return $this->profile_image;
        }

        // Generate URL using the public disk
        return Storage::disk('public')->url($this->profile_image);
    }

    /**
     * Define the role constants
     */
    const ROLE_CUSTOMER = 'customer';
    const ROLE_SALES_MANAGER = 'sales_manager';
    const ROLE_STAFF = 'staff';
    const ROLE_ADMIN = 'admin';

    /**
     * Check if user is a customer
     */
    public function isCustomer(): bool
    {
        return $this->role === self::ROLE_CUSTOMER;
    }

    /**
     * Check if user is a sales manager
     */
    public function isSalesManager(): bool
    {
        return $this->role === self::ROLE_SALES_MANAGER;
    }

    /**
     * Check if user is staff
     */
    public function isStaff(): bool
    {
        return $this->role === self::ROLE_STAFF;
    }

    /**
     * Check if user is admin
     */
    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    /**
     * Job orders created by this customer
     */
    public function jobOrders()
    {
        return $this->hasMany(JobOrder::class, 'customer_id');
    }

    /**
     * Job orders started by this sales manager
     */
    public function startedJobOrders()
    {
        return $this->hasMany(JobOrder::class, 'started_by');
    }

    /**
     * Processes handled by this staff member
     */
    public function processes()
    {
        return $this->hasMany(Process::class, 'pic_id');
    }

    /**
     * Notifications sent to this user
     */
    public function notifications()
    {
        return $this->hasMany(Notification::class, 'recipient_id');
    }

    /**
     * Order tracking entries managed by this admin
     */
    public function orderTrackings()
    {
        return $this->hasMany(OrderTracking::class, 'admin_id');
    }

    /**
     * Customer management entries for this customer
     */
    public function customerManagements()
    {
        return $this->hasMany(CustomerManagement::class, 'customer_id');
    }

    /**
     * Customer management entries managed by this admin
     */
    public function managedCustomers()
    {
        return $this->hasMany(CustomerManagement::class, 'admin_id');
    }

    /**
     * Files uploaded by this user
     */
    public function uploadedFiles()
    {
        return $this->hasMany(OrderFile::class, 'uploaded_by');
    }
}
