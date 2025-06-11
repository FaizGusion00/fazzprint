<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProcessStep extends Model
{
    use HasFactory;

    /**
     * The primary key for the model.
     *
     * @var string
     */
    protected $primaryKey = 'process_step_id';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'job_order_id',
        'step_name',
        'step_description',
        'step_order',
        'estimated_duration',
        'is_required',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'is_required' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the job order that owns this process step
     */
    public function jobOrder()
    {
        return $this->belongsTo(JobOrder::class, 'job_order_id', 'job_order_id');
    }

    /**
     * Get the processes for this step
     */
    public function processes()
    {
        return $this->hasMany(Process::class, 'process_step_id');
    }

    /**
     * Get the current active process for this step
     */
    public function currentProcess()
    {
        return $this->hasOne(Process::class, 'process_step_id')
            ->where('status', 'in_progress')
            ->latest();
    }

    /**
     * Get the completed process for this step
     */
    public function completedProcess()
    {
        return $this->hasOne(Process::class, 'process_step_id')
            ->where('status', 'completed')
            ->latest();
    }

    /**
     * Check if this step is completed
     */
    public function isCompleted(): bool
    {
        return $this->processes()->where('status', 'completed')->exists();
    }

    /**
     * Check if this step is in progress
     */
    public function isInProgress(): bool
    {
        return $this->processes()->where('status', 'in_progress')->exists();
    }

    /**
     * Check if this step is pending
     */
    public function isPending(): bool
    {
        return !$this->processes()->whereIn('status', ['in_progress', 'completed'])->exists();
    }

    /**
     * Get the status of this step
     */
    public function getStatus(): string
    {
        if ($this->isCompleted()) {
            return 'completed';
        } elseif ($this->isInProgress()) {
            return 'in_progress';
        } else {
            return 'pending';
        }
    }
}
