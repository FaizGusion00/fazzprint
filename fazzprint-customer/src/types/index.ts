// User types based on Laravel backend
export interface User {
  user_id: number
  user_name: string
  full_name: string
  email: string
  phone_number: string
  address?: string
  role: 'customer' | 'staff' | 'sales_manager' | 'admin'
  created_at: string
  updated_at?: string
  profile_image?: string
  profile_image_url?: string
}

export interface LoginData {
  login: string // email, username, or phone
  password: string
  remember_me?: boolean
}

export interface RegisterData {
  user_name: string
  full_name: string
  email: string
  phone_number: string
  address: string
  password: string
  password_confirmation: string
}

export interface AuthResponse {
  user: User
  access_token: string
  token_type: string
}

// Job Order types
export interface JobOrder {
  job_order_id: number
  customer_id: number
  started_by?: number
  status: 'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled'
  job_order_url: string
  title: string
  description: string
  quantity: number
  design_requirements?: string
  special_instructions?: string
  due_date?: string
  created_at: string
  updated_at: string
  customer?: User
  salesManager?: User
  order_files?: OrderFile[]
  notifications?: Notification[]
  orderTrackings?: OrderTracking[]
  progress_percentage?: number
  completed_steps?: number
  total_steps?: number
}

export interface CreateOrderData {
  title: string
  description: string
  quantity: number
  design_requirements?: string
  special_instructions?: string
  due_date?: string
  files?: File[]
}

export interface OrderFile {
  file_id: number
  job_order_id: number
  uploaded_by: number
  file_name: string
  file_path: string
  file_size: number
  file_type: string
  mime_type: string
  description?: string
  is_design_file: boolean
  created_at: string
  updated_at: string
}

// Statistics types
export interface DashboardStats {
  total_orders: number
  completed_orders: number
  pending_orders: number
  in_progress_orders: number
  recent_orders: JobOrder[]
}

// Notification types - updated to match backend enum
export interface Notification {
  notification_id: number
  recipient_id: number
  job_order_id?: number
  type: 'order_created' | 'order_started' | 'order_in_progress' | 'order_completed' | 'process_started' | 'process_completed' | 'general'
  title: string
  message: string
  is_read: boolean
  email_sent: boolean
  sent_at?: string
  created_at: string
  updated_at: string
  recipient?: {
    user_id: number
    full_name: string
  }
  job_order?: {
    job_order_id: number
    job_order_url: string
    title: string
  }
}

// Order tracking types - updated to match backend schema
export interface OrderTracking {
  tracking_id: number
  job_order_id: number
  admin_id?: number
  status: 'received' | 'design_review' | 'production_queue' | 'in_production' | 'quality_check' | 'packaging' | 'ready_for_pickup' | 'completed' | 'cancelled'
  location: string
  description: string
  progress_percentage?: number
  estimated_completion?: string
  actual_completion?: string
  notes?: string
  created_at: string
  updated_at: string
}

// Tracking response types
export interface TrackingResponse {
  job_order: JobOrder
  tracking_history: any[]
  progress: {
    percentage: number
    current_status: string
    completed_steps: number
    total_steps: number
    estimated_completion: string | null
  }
  next_steps: any[]
  can_cancel: boolean
}

// Chart data types
export interface ChartDataResponse {
  message: string
  data: {
    orders_trend: Array<{
      month: string
      orders: number
      monthShort: string
      year: string
    }>
    status_distribution: Array<{
      status: string
      count: number
      value: number
    }>
    spending_trend: Array<{
      month: string
      amount: number
      monthShort: string
      year: string
    }>
    completion_rate: Array<{
      month: string
      rate: number
      completed: number
      total: number
      monthShort: string
    }>
  }
}

// Form state types
export interface FormState {
  isLoading: boolean
  errors: Record<string, string>
}

// API error type
export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  status?: number
} 