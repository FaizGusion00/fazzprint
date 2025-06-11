<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderFile extends Model
{
    use HasFactory;

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'file_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'job_order_id',
        'uploaded_by',
        'file_name',
        'file_path',
        'file_size',
        'file_type',
        'mime_type',
        'description',
        'is_design_file',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'file_size' => 'integer',
        'is_design_file' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the job order this file belongs to
     */
    public function jobOrder()
    {
        return $this->belongsTo(JobOrder::class, 'job_order_id', 'job_order_id');
    }

    /**
     * Get the user who uploaded this file
     */
    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by', 'user_id');
    }

    /**
     * Get the file URL for viewing/access
     */
    public function getFileUrl(): string
    {
        return asset('storage/' . $this->file_path);
    }

    /**
     * Get the download URL for this file
     */
    public function getDownloadUrl(): string
    {
        return route('api.orders.files.download', [
            'orderId' => $this->job_order_id,
            'fileId' => $this->file_id
        ]);
    }

    /**
     * Get the file URL attribute for JSON serialization
     */
    public function getFileUrlAttribute(): string
    {
        return $this->getFileUrl();
    }

    /**
     * Get the download URL attribute for JSON serialization
     */
    public function getDownloadUrlAttribute(): string
    {
        return $this->getDownloadUrl();
    }

    /**
     * Get file size in human readable format
     */
    public function getFileSizeForHumans(): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $size = $this->file_size;
        $unit = 0;

        while ($size >= 1024 && $unit < count($units) - 1) {
            $size /= 1024;
            $unit++;
        }

        return round($size, 2) . ' ' . $units[$unit];
    }

    /**
     * Check if file is an image
     */
    public function isImage(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    /**
     * Check if file is a design file (Photoshop, AI, etc.)
     */
    public function isDesignFile(): bool
    {
        return $this->is_design_file || in_array($this->file_type, [
            'psd', 'ai', 'eps', 'pdf', 'svg'
        ]);
    }

    /**
     * Get file icon based on type
     */
    public function getFileIcon(): string
    {
        return match(strtolower($this->file_type)) {
            'pdf' => 'fas fa-file-pdf',
            'doc', 'docx' => 'fas fa-file-word',
            'xls', 'xlsx' => 'fas fa-file-excel',
            'ppt', 'pptx' => 'fas fa-file-powerpoint',
            'jpg', 'jpeg', 'png', 'gif', 'bmp' => 'fas fa-file-image',
            'mp4', 'avi', 'mov' => 'fas fa-file-video',
            'mp3', 'wav' => 'fas fa-file-audio',
            'zip', 'rar', '7z' => 'fas fa-file-archive',
            'psd' => 'fab fa-photoshop',
            'ai' => 'fab fa-adobe',
            default => 'fas fa-file'
        };
    }
}
