import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import toast from 'react-hot-toast'
import { API_BASE_URL } from '@/config'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('fazzprint_admin_token') || localStorage.getItem('auth_token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error: AxiosError) => {
    console.error('API Error:', error)
    
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('fazzprint_admin_token')
      localStorage.removeItem('fazzprint_admin_user')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
        toast.error('Session expired. Please login again.')
      }
    } else if (error.response && error.response.status === 403) {
      toast.error('Access denied. Insufficient permissions.')
    } else if (error.response && error.response.status === 404) {
      // Don't show toast for 404s as they might be expected
      console.warn('Resource not found:', error.config?.url)
    } else if (error.response && error.response.status >= 500) {
      toast.error('Server error. Please try again later.')
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timeout. Please check your connection.')
    } else if (error.code === 'ERR_NETWORK') {
      toast.error('Network error. Please check if the backend server is running.')
    } else if (!error.response) {
      toast.error('Unable to connect to server. Please check your internet connection.')
    }
    return Promise.reject(error)
  }
)

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

// Generic API methods
export const apiService = {
  // GET request
  get: async <T>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await api.get(endpoint, config)
      return response.data
    } catch (error) {
      console.error(`GET ${endpoint} failed:`, error)
      throw error
    }
  },

  // POST request
  post: async <T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await api.post(endpoint, data, config)
      return response.data
    } catch (error) {
      console.error(`POST ${endpoint} failed:`, error)
      throw error
    }
  },

  // PUT request
  put: async <T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await api.put(endpoint, data, config)
      return response.data
    } catch (error) {
      console.error(`PUT ${endpoint} failed:`, error)
      throw error
    }
  },

  // DELETE request
  delete: async <T>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    try {
      const response = await api.delete(endpoint, config)
      return response.data
    } catch (error) {
      console.error(`DELETE ${endpoint} failed:`, error)
      throw error
    }
  },

  // Upload file
  upload: async <T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> => {
    try {
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minutes for file uploads
      })
      return response.data
    } catch (error) {
      console.error(`UPLOAD ${endpoint} failed:`, error)
      throw error
    }
  },

  // Download file
  download: async (endpoint: string, filename?: string): Promise<void> => {
    try {
      const response = await api.get(endpoint, {
        responseType: 'blob',
        timeout: 60000, // 1 minute for downloads
      })
      
      // Create blob URL and trigger download
      const blob = new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error(`DOWNLOAD ${endpoint} failed:`, error)
      throw error
    }
  },

  // Test connection
  testConnection: async (): Promise<boolean> => {
    try {
      const response = await api.get('/status')
      return response.status === 200
    } catch (error) {
      console.error('Backend connection test failed:', error)
      return false
    }
  },

  // Health check
  healthCheck: async (): Promise<{ status: 'healthy' | 'unhealthy', details?: any }> => {
    try {
      const response = await api.get('/status')
      return {
        status: 'healthy',
        details: response.data
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: error
      }
    }
  }
}

// Role-specific API endpoints
export const adminApiService = {
  // Authentication
  auth: {
    login: (data: any) => apiService.post('/auth/login', data),
    logout: () => apiService.post('/auth/logout'),
    profile: () => apiService.get('/auth/profile'),
    updateProfile: (data: any) => apiService.put('/auth/profile', data),
    changePassword: (data: any) => apiService.post('/auth/change-password', data),
    checkRole: (role: string) => apiService.get(`/auth/check-role/${role}`),
  },

  // Orders Management (Sales Manager & Admin)
  orders: {
    getAll: (params?: any) => apiService.get('/orders', { params }),
    getById: (id: number) => apiService.get(`/orders/${id}`),
    update: (id: number, data: any) => apiService.put(`/orders/${id}`, data),
    startOrder: (id: number) => apiService.post(`/orders/${id}/start`),
    cancelOrder: (id: number, data?: any) => apiService.post(`/orders/${id}/cancel`, data),
    uploadFile: (id: number, formData: FormData) => apiService.upload(`/orders/${id}/upload`, formData),
    downloadFile: (orderId: number, fileId: number, filename: string) => 
      apiService.download(`/orders/${orderId}/files/${fileId}/download`, filename),
    deleteFile: (orderId: number, fileId: number) => apiService.delete(`/orders/${orderId}/files/${fileId}`),
    getStatistics: () => apiService.get('/orders/statistics'),
    trackOrder: (orderId: number) => apiService.get(`/tracking/order/${orderId}`),
    getEstimate: (data: any) => apiService.post('/orders/estimate', data),
  },

  // QR Code Management (Sales Manager & Admin)
  qrCodes: {
    getAll: (params?: any) => apiService.get('/qr-codes', { params }),
    generate: (orderId: number) => apiService.post(`/qr-codes/generate/${orderId}`),
    validate: (code: string) => apiService.get(`/qr-codes/${code}/validate`),
    getInfo: (code: string) => apiService.get(`/qr-codes/${code}/info`),
    regenerate: (code: string) => apiService.post(`/qr-codes/${code}/regenerate`),
    deactivate: (code: string) => apiService.post(`/qr-codes/${code}/deactivate`),
  },

  // Process Management (Staff & Admin)
  processes: {
    getActive: () => apiService.get('/processes'),
    getAvailable: () => apiService.get('/processes/available'),
    scanQR: (qrData: string) => apiService.post('/processes/scan', { qr_data: qrData }),
    startProcess: (processStepId: number, data: any) => apiService.post(`/processes/${processStepId}/start`, data),
    pauseProcess: (processId: number) => apiService.post(`/processes/${processId}/pause`),
    resumeProcess: (processId: number) => apiService.post(`/processes/${processId}/resume`),
    completeProcess: (processId: number, data: any) => apiService.post(`/processes/${processId}/complete`, data),
    getStatus: (processId: number) => apiService.get(`/processes/${processId}/status`),
    updateQuantity: (processId: number, data: any) => apiService.put(`/processes/${processId}/update-quantity`, data),
    getMyTasks: () => apiService.get('/staff/my-tasks'),
    getWorkHistory: () => apiService.get('/staff/work-history'),
  },

  // Notifications
  notifications: {
    getAll: (params?: any) => apiService.get('/notifications', { params }),
    getPopup: () => apiService.get('/notifications/popup'),
    getUnread: () => apiService.get('/notifications/unread'),
    markAsRead: (id: number) => apiService.post(`/notifications/${id}/read`),
    markAllAsRead: () => apiService.post('/notifications/read-all'),
    delete: (id: number) => apiService.delete(`/notifications/${id}`),
  },

  // Dashboard & Analytics
  dashboard: {
    getStats: () => apiService.get('/dashboard/stats'),
    getCharts: () => apiService.get('/dashboard/charts'),
  },

  // Sales Manager specific
  sales: {
    getPendingOrders: () => apiService.get('/sales/pending-orders'),
    assignStaff: (orderId: number, data: any) => apiService.post(`/sales/assign-staff/${orderId}`, data),
    getStaffPerformance: () => apiService.get('/sales/staff-performance'),
  },

  // Admin specific
  admin: {
    getAllUsers: () => apiService.get('/admin/users'),
    updateUserRole: (userId: number, role: string) => apiService.post(`/admin/users/${userId}/role`, { role }),
    getSystemStats: () => apiService.get('/admin/system-stats'),
  },

  // Tracking
  tracking: {
    search: (params: any) => apiService.get('/tracking/search', { params }),
  },

  // Profile & Settings
  profile: {
    uploadImage: (formData: FormData) => apiService.upload('/profile/image', formData),
  }
}

export default api 