import { apiService } from './api'

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

export interface NotificationFilters {
  type?: string
  read_status?: 'read' | 'unread'
  email_sent?: string
  date_from?: string
  date_to?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  per_page?: number
}

export interface NotificationsResponse {
  data: Notification[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

export interface NotificationPreferences {
  email_notifications: boolean
  push_notifications: boolean
  sms_notifications: boolean
  enabled_types: string[]
  quiet_hours_start?: string
  quiet_hours_end?: string
}

export const notificationService = {
  // Get notifications with filtering and pagination
  getNotifications: async (filters: NotificationFilters = {}) => {
    const params = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString())
      }
    })

    return apiService.get<{
      data: NotificationsResponse
      summary: {
        total_notifications: number
        unread_count: number
        high_priority_count: number
      }
    }>(`/notifications?${params}`)
  },

  // Get unread notifications count and recent notifications
  getUnreadNotifications: async () => {
    return apiService.get<{
      unread_count: number
      high_priority_count: number
      recent_notifications: Notification[]
      has_unread: boolean
    }>('/notifications/unread')
  },

  // Get notifications for popup (simple format)
  getPopupNotifications: async () => {
    return apiService.get<{
      notifications: Array<{
        notification_id: number
        type: string
        title: string
        message: string
        is_read: boolean
        created_at: string
      }>
      unread_count: number
    }>('/notifications/popup')
  },

  // Mark specific notification as read
  markAsRead: async (notificationId: number) => {
    return apiService.post<{ notification: Notification }>(`/notifications/${notificationId}/read`)
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    return apiService.post<{ updated_count: number }>('/notifications/read-all')
  },

  // Delete notification
  deleteNotification: async (notificationId: number) => {
    return apiService.delete(`/notifications/${notificationId}`)
  },

  // Get notification preferences
  getPreferences: async () => {
    return apiService.get<{
      preferences: NotificationPreferences
      available_types: Record<string, string>
    }>('/notifications/preferences')
  },

  // Update notification preferences
  updatePreferences: async (preferences: Partial<NotificationPreferences>) => {
    return apiService.post<{ preferences: NotificationPreferences }>('/notifications/preferences', preferences)
  },

  // Get notification statistics
  getStatistics: async (period: 'week' | 'month' | 'year' = 'month') => {
    return apiService.get<{
      period: string
      total_notifications: number
      read_notifications: number
      unread_notifications: number
      high_priority: number
      medium_priority: number
      low_priority: number
      notifications_by_type: Record<string, number>
      daily_breakdown: Record<string, number>
      response_time_avg: number
    }>(`/notifications/statistics?period=${period}`)
  }
}

export default notificationService 