import { apiService } from './api'
import { JobOrder, CreateOrderData } from '@/types'

export interface OrdersResponse {
  orders: JobOrder[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
  }
}

export interface OrderFilters {
  status?: string
  search?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export const orderService = {
  // Get all orders with filters and pagination (use customer-specific endpoint)
  getOrders: async (filters: OrderFilters = {}) => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString())
      }
    })

    // Use customer-specific endpoint that pulls from job_orders table
    return apiService.get<{
      data: JobOrder[]
      current_page: number
      last_page: number
      per_page: number
      total: number
      from: number
      to: number
    }>(`/customer/my-orders?${params}`)
  },

  // Get single order by ID
  getOrder: async (orderId: number) => {
    return apiService.get<{ 
      job_order: JobOrder
      status_info?: {
        current_phase?: string
        progress_percentage?: number
        estimated_completion?: string
      }
    }>(`/orders/${orderId}`)
  },

  // Create new order
  createOrder: async (orderData: CreateOrderData) => {
    const formData = new FormData()
    
    // Add regular fields
    formData.append('title', orderData.title)
    formData.append('description', orderData.description)
    formData.append('quantity', orderData.quantity.toString())
    
    if (orderData.design_requirements) {
      formData.append('design_requirements', orderData.design_requirements)
    }
    
    if (orderData.special_instructions) {
      formData.append('special_instructions', orderData.special_instructions)
    }
    
    if (orderData.due_date) {
      formData.append('due_date', orderData.due_date)
    }
    
    // Add files if they exist
    if (orderData.files && orderData.files.length > 0) {
      orderData.files.forEach((file, index) => {
        formData.append(`files[${index}]`, file)
      })
    }

    return apiService.upload<{ job_order: JobOrder }>('/orders', formData)
  },

  // Update order
  updateOrder: async (orderId: number, orderData: Partial<CreateOrderData>) => {
    return apiService.put<{ order: JobOrder }>(`/orders/${orderId}`, orderData)
  },

  // Delete order (what user sees as "cancel")
  cancelOrder: async (orderId: number, reason?: string) => {
    return apiService.delete<{ message: string }>(`/orders/${orderId}`, { 
      data: { reason: reason || 'Cancelled by customer' }
    })
  },

  // Upload files for order
  uploadOrderFiles: async (orderId: number, files: File[]) => {
    const formData = new FormData()
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file)
    })

    return apiService.upload<{ files: any[] }>(`/orders/${orderId}/upload`, formData)
  },

  // Upload single file with description and design file flag
  uploadOrderFile: async (orderId: number, file: File, description?: string, isDesignFile: boolean = false) => {
    const formData = new FormData()
    formData.append('file', file)
    if (description) {
      formData.append('description', description)
    }
    formData.append('is_design_file', isDesignFile.toString())

    return apiService.upload<{ file: any }>(`/orders/${orderId}/upload`, formData)
  },

  // Download order file
  downloadOrderFile: async (orderId: number, fileId: number, fileName: string) => {
    try {
      // Use a direct window.open approach for downloads to avoid blob typing issues
      const downloadUrl = `${import.meta.env.VITE_API_URL}/api/orders/${orderId}/files/${fileId}/download`
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = fileName
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      link.remove()

      return { success: true, message: 'File downloaded successfully' }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to download file')
    }
  },

  // Get file preview URL
  getFilePreviewUrl: (orderId: number, fileId: number) => {
    return `${import.meta.env.VITE_API_URL}/api/orders/${orderId}/files/${fileId}/download`
  },

  // Delete order file
  deleteOrderFile: async (orderId: number, fileId: number) => {
    return apiService.delete(`/orders/${orderId}/files/${fileId}`)
  },

  // Get order tracking history using order_tracking table
  getOrderTracking: async (orderId: number) => {
    return apiService.get<{ 
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
    }>(`/tracking/order/${orderId}`)
  },

  // Track order by order URL/code
  trackOrderByCode: async (orderCode: string) => {
    return apiService.get<{ 
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
    }>(`/tracking/order/${orderCode}`)
  },

  // Track order by various identifiers (order_id, tracking_id, or order_url)
  async trackByCode(searchTerm: string): Promise<any> {
    try {
      // First try to find by tracking_id in order_trackings table
      const trackingResponse = await apiService.get(`/tracking/search?code=${searchTerm}`)
      if (trackingResponse.data && trackingResponse.success) {
        return trackingResponse
      }
    } catch (error) {
      // If tracking search fails, continue with order search
      console.log('Tracking search failed, trying order search:', error)
    }

    try {
      // Fallback to search by order_id or order_url
      const orderResponse = await apiService.get(`/orders/track/${searchTerm}`)
      return orderResponse
    } catch (error) {
      throw error
    }
  },

  // Original track method for backward compatibility
  async track(orderId: string): Promise<any> {
    const response = await apiService.get(`/orders/track/${orderId}`)
    return response
  },

  // Get dashboard statistics (use correct endpoint)
  getDashboardStats: async () => {
    return apiService.get<{
      total_orders: number
      completed_orders: number
      pending_orders: number
      in_progress_orders: number
      recent_orders: JobOrder[]
    }>('/dashboard/stats')
  },

  // Track order by ID (use the correct tracking endpoint)
  trackOrder: async (orderId: number) => {
    return apiService.get<{
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
    }>(`/tracking/order/${orderId}`)
  },

  // Get customer's orders (use the dedicated customer endpoint)
  getMyOrders: async (filters: OrderFilters = {}) => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString())
      }
    })

    return apiService.get<{
      data: JobOrder[]
      current_page: number
      last_page: number
      per_page: number
      total: number
      from: number
      to: number
    }>(`/customer/my-orders?${params}`)
  },

  // Reorder (duplicate existing order)
  reorder: async (orderId: number) => {
    return apiService.post<{ new_order: JobOrder; original_order: JobOrder }>(`/customer/reorder/${orderId}`)
  },

  // Download order invoice/receipt
  downloadInvoice: async (orderId: number) => {
    return apiService.get(`/orders/${orderId}/invoice`, {
      responseType: 'blob'
    })
  },

  // Get order estimates/quotes
  getEstimate: async (orderData: Partial<CreateOrderData>) => {
    return apiService.post<{
      estimated_cost: number
      estimated_duration: string
      breakdown: any
    }>('/orders/estimate', orderData)
  },

  // Get chart data for dashboard analytics (use correct endpoint)
  getChartData: async () => {
    return apiService.get<{
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
    }>('/dashboard/charts')
  },

  // Get customer order history
  getOrderHistory: async (period: 'week' | 'month' | 'year' | 'all' = 'all') => {
    return apiService.get<{
      orders: JobOrder[]
      statistics: {
        total_orders: number
        completed_orders: number
        in_progress_orders: number
        draft_orders: number
        cancelled_orders: number
        total_quantity: number
        period: string
      }
    }>(`/customer/order-history?period=${period}`)
  },

  // Send message for order (max 2 per day per order)
  sendOrderMessage: async (orderId: number, message: string) => {
    return apiService.post<{ 
      message: any
      remaining_messages: number 
    }>(`/orders/${orderId}/messages`, { 
      message 
    })
  },

  // Get order messages/communications
  getOrderMessages: async (orderId: number) => {
    return apiService.get<{ 
      messages: any[]
      can_send_message: boolean
      remaining_messages_today: number
    }>(`/orders/${orderId}/messages`)
  },
}

export default orderService 