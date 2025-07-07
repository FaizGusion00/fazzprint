// User and Authentication Types
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
  last_login_at?: string
  profile_image?: string
  profile_image_url?: string
  settings?: Record<string, any>
}

export interface LoginData {
  login: string // email, username, or phone
  password: string
  remember_me?: boolean
}

export interface AuthResponse {
  user: User
  access_token: string
  token_type: string
}

// Job Order Types
export interface JobOrder {
  job_order_id: number
  customer_id: number
  started_by?: number
  status: 'draft' | 'started' | 'in_progress' | 'completed' | 'cancelled'
  job_order_url: string
  title: string
  description: string
  quantity: number
  design_requirements?: string
  special_instructions?: string
  due_date?: string
  estimated_price?: number
  quoted_price?: number
  final_price?: number
  payment_status: 'pending' | 'partial' | 'paid' | 'refunded'
  amount_paid: number
  balance_due?: number
  payment_notes?: string
  payment_due_date?: string
  payment_confirmed_at?: string
  payment_confirmed_by?: number
  created_at: string
  updated_at: string
  customer?: User
  salesManager?: User
  paymentConfirmer?: User
  order_files?: OrderFile[]
  notifications?: Notification[]
  orderTrackings?: OrderTracking[]
  processSteps?: ProcessStep[]
  qrCode?: QRCode
  progress_percentage?: number
  completed_steps?: number
  total_steps?: number
}

// Process Management Types
export interface ProcessStep {
  process_step_id: number
  job_order_id: number
  step_name: string
  step_description: string
  step_order: number
  estimated_duration: number
  status: 'pending' | 'in_progress' | 'completed'
  created_at: string
  updated_at: string
  jobOrder?: JobOrder
  processes?: Process[]
  currentProcess?: Process
  completedProcess?: Process
}

export interface Process {
  process_id: number
  process_step_id: number
  pic_id: number
  status: 'active' | 'paused' | 'completed'
  start_time: string
  end_time?: string
  start_quantity: number
  end_quantity?: number
  reject_quantity?: number
  staff_name: string
  remark?: string
  created_at: string
  updated_at: string
  processStep?: ProcessStep
  staff?: User
  duration_minutes?: number
  good_quantity?: number
  processing_rate?: number
}

// QR Code Types
export interface QRCode {
  qr_code_id: number
  job_order_id: number
  qr_code_data: string
  qr_image_path?: string
  status: 'active' | 'used' | 'expired' | 'deactivated'
  generated_by?: number
  expires_at?: string
  created_at: string
  updated_at: string
  jobOrder?: JobOrder
  generator?: User
}

// File Types
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
  file_url?: string
  download_url?: string
  jobOrder?: JobOrder
  uploader?: User
}

// Notification Types
export interface Notification {
  notification_id: number
  recipient_id: number
  job_order_id?: number
  type: 'order_created' | 'order_started' | 'order_in_progress' | 'order_completed' | 'process_started' | 'process_completed' | 'payment_received' | 'general'
  title: string
  message: string
  is_read: boolean
  email_sent: boolean
  sent_at?: string
  created_at: string
  updated_at: string
  recipient?: User
  jobOrder?: JobOrder
}

// Order Tracking Types
export interface OrderTracking {
  tracking_id: number
  job_order_id: number
  admin_id?: number
  status: 'received' | 'under_review' | 'production_queue' | 'in_production' | 'quality_check' | 'completed' | 'delivered'
  description: string
  progress_percentage?: number
  created_at: string
  updated_at: string
  jobOrder?: JobOrder
  admin?: User
}

// Dashboard Statistics Types
export interface AdminDashboardStats {
  // Sales Manager Stats
  total_orders: number
  pending_orders: number
  active_orders: number
  completed_orders: number
  revenue_this_month: number
  orders_this_month: number
  pending_payments: number
  
  // Staff Stats
  active_processes: number
  my_tasks: number
  completed_today: number
  efficiency_rate: number
  
  // General Stats
  total_customers: number
  total_staff: number
  system_health: 'good' | 'warning' | 'critical'
  recent_activities: ActivityItem[]
}

export interface ActivityItem {
  id: number
  type: 'order_created' | 'order_completed' | 'process_started' | 'process_completed'
  title: string
  description: string
  timestamp: string
  user?: User
  jobOrder?: JobOrder
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

// Filter Types
export interface OrderFilters {
  status?: string
  payment_status?: string
  search?: string
  customer_id?: number
  date_from?: string
  date_to?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface ProcessFilters {
  status?: string
  staff_id?: number
  job_order_id?: number
  date_from?: string
  date_to?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

// Utility Types
export interface FormState {
  isLoading: boolean
  errors: Record<string, string>
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
  status?: number
}

export interface SessionData {
  token: string
  user: User
  expires_at: number
  created_at: number
}

// Role-based Access Types
export type UserRole = 'customer' | 'staff' | 'sales_manager' | 'admin'

export interface RolePermissions {
  canViewAllOrders: boolean
  canEditOrders: boolean
  canDeleteOrders: boolean
  canGenerateQR: boolean
  canManageProcesses: boolean
  canViewAnalytics: boolean
  canManageUsers: boolean
  canAccessSystemSettings: boolean
}