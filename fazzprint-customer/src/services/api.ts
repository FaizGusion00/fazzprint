import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import toast from 'react-hot-toast'

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased timeout for better connectivity
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('auth_token')
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
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
        toast.error('Session expired. Please login again.')
      }
    } else if (error.response && error.response.status === 403) {
      toast.error('Access denied. Insufficient permissions.')
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
        timeout: 60000, // 60 seconds for file uploads
      })
      return response.data
    } catch (error) {
      console.error(`UPLOAD ${endpoint} failed:`, error)
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
}

export default api 