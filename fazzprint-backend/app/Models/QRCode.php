<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QRCode extends Model
{
    use HasFactory;

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'qr_code_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'job_order_id',
        'qr_code_data',
        'qr_code_image_path',
        'is_active',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the job order that owns this QR code
     */
    public function jobOrder()
    {
        return $this->belongsTo(JobOrder::class, 'job_order_id', 'job_order_id');
    }

    /**
     * Generate QR code data for a job order
     */
    public static function generateQRData($jobOrderId): string
    {
        return encrypt([
            'job_order_id' => $jobOrderId,
            'timestamp' => now()->timestamp,
            'type' => 'job_order'
        ]);
    }

    /**
     * Decode QR code data
     */
    public static function decodeQRData($qrData): ?array
    {
        try {
            return decrypt($qrData);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Check if QR code is valid and active
     */
    public function isValid(): bool
    {
        return $this->is_active && $this->jobOrder && !$this->jobOrder->isCompleted();
    }

    /**
     * Get the QR code image URL
     */
    public function getQRImageUrl(): ?string
    {
        if (!$this->qr_code_image_path) {
            return null;
        }

        return asset('storage/' . $this->qr_code_image_path);
    }

    /**
     * Deactivate the QR code
     */
    public function deactivate(): void
    {
        $this->update(['is_active' => false]);
    }
}
