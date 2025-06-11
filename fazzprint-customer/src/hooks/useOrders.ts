import { useQuery, useMutation, useQueryClient } from 'react-query'
import { orderService, OrderFilters } from '@/services/orderService'
import { CreateOrderData } from '@/types'

// Query keys for React Query
export const ORDER_QUERY_KEYS = {
  orders: ['orders'],
  order: (id: number) => ['orders', id],
  dashboardStats: ['dashboard', 'stats'],
  orderTracking: (id: number) => ['orders', id, 'tracking'],
  trackByCode: (code: string) => ['track', code],
  chartData: ['dashboard', 'charts'],
}

// Hook for fetching orders list (now using customer-specific endpoint)
export const useOrders = (filters: OrderFilters = {}) => {
  return useQuery(
    [ORDER_QUERY_KEYS.orders[0], filters],
    async () => {
      const response = await orderService.getOrders(filters)
      // Transform the response to match expected format
      return {
        data: {
          orders: response.data?.data || [],
          pagination: {
            current_page: response.data?.current_page || 1,
            last_page: response.data?.last_page || 1,
            per_page: response.data?.per_page || 10,
            total: response.data?.total || 0,
            from: response.data?.from || 0,
            to: response.data?.to || 0
          }
        }
      }
    },
    {
      keepPreviousData: true,
      staleTime: 30000, // 30 seconds
      refetchInterval: 60000, // Auto-refresh every minute
      refetchIntervalInBackground: true, // Continue refreshing in background
      retry: 2,
      onError: (error: any) => {
        console.error('Orders fetch error:', error)
      }
    }
  )
}

// Hook for fetching single order
export const useOrder = (orderId: number) => {
  return useQuery(
    ORDER_QUERY_KEYS.order(orderId),
    () => orderService.getOrder(orderId),
    {
      enabled: !!orderId,
      staleTime: 60000, // 1 minute
      refetchInterval: 30000, // Auto-refresh every 30 seconds for real-time updates
      refetchIntervalInBackground: true,
      retry: 2,
      onError: (error: any) => {
        console.error('Order fetch error:', error)
      }
    }
  )
}

// Hook for dashboard statistics
export const useDashboardStats = () => {
  return useQuery(
    ORDER_QUERY_KEYS.dashboardStats,
    () => orderService.getDashboardStats(),
    {
      staleTime: 300000, // 5 minutes
      refetchInterval: 120000, // Auto-refresh every 2 minutes
      refetchIntervalInBackground: true,
      retry: 2,
      onError: (error: any) => {
        console.error('Dashboard stats fetch error:', error)
      }
    }
  )
}

// Hook for order tracking
export const useOrderTracking = (orderId: number) => {
  return useQuery(
    ORDER_QUERY_KEYS.orderTracking(orderId),
    () => orderService.trackOrder(orderId),
    {
      enabled: !!orderId,
      staleTime: 30000, // 30 seconds
      refetchInterval: 15000, // Auto-refresh every 15 seconds for real-time tracking
      refetchIntervalInBackground: true,
      retry: 2,
      onError: (error: any) => {
        console.error('Order tracking error:', error)
      }
    }
  )
}

// Hook for tracking by order code
export const useTrackByCode = (code: string) => {
  return useQuery(
    ORDER_QUERY_KEYS.trackByCode(code),
    () => orderService.trackByCode(code),
    {
      enabled: !!code && code.length > 0,
      staleTime: 30000, // 30 seconds
      refetchInterval: 15000, // Auto-refresh every 15 seconds
      refetchIntervalInBackground: true,
      retry: 2,
      onError: (error: any) => {
        console.error('Track by code error:', error)
      }
    }
  )
}

// Hook for chart data (handle correct response format)
export const useChartData = () => {
  return useQuery(
    ORDER_QUERY_KEYS.chartData,
    async () => {
      const response = await orderService.getChartData()
      // The backend returns { message, data: { orders_trend, status_distribution, spending_trend, completion_rate } }
      // We need to transform it to match the expected format in the frontend
      return {
        data: {
          data: response.data || {
            orders_trend: [],
            status_distribution: [],
            spending_trend: [],
            completion_rate: []
          }
        }
      }
    },
    {
      staleTime: 300000, // 5 minutes
      refetchInterval: 180000, // Auto-refresh every 3 minutes
      refetchIntervalInBackground: true,
      retry: 2,
      onError: (error: any) => {
        console.error('Chart data fetch error:', error)
      }
    }
  )
}

// Hook for creating new orders
export const useCreateOrder = () => {
  const queryClient = useQueryClient()
  
  return useMutation(
    (orderData: CreateOrderData) => orderService.createOrder(orderData),
    {
      onSuccess: (response) => {
        // Invalidate all related queries to refresh data
        queryClient.invalidateQueries(ORDER_QUERY_KEYS.orders)
        queryClient.invalidateQueries(ORDER_QUERY_KEYS.dashboardStats)
        queryClient.invalidateQueries(ORDER_QUERY_KEYS.chartData)
        queryClient.invalidateQueries(['notifications']) // Also refresh notifications
        
        // Optionally set the new order data directly in cache
        if (response.data?.job_order) {
          queryClient.setQueryData(
            ORDER_QUERY_KEYS.order(response.data.job_order.job_order_id),
            { data: { job_order: response.data.job_order } }
          )
        }
      },
      onError: (error: any) => {
        console.error('Failed to create order:', error)
      }
    }
  )
}

export const useUpdateOrder = () => {
  const queryClient = useQueryClient()

  return useMutation(
    ({ orderId, orderData }: { orderId: number; orderData: Partial<CreateOrderData> }) =>
      orderService.updateOrder(orderId, orderData),
    {
      onSuccess: (response, { orderId }) => {
        // Invalidate all related queries
        queryClient.invalidateQueries(ORDER_QUERY_KEYS.orders)
        queryClient.invalidateQueries(ORDER_QUERY_KEYS.order(orderId))
        queryClient.invalidateQueries(ORDER_QUERY_KEYS.dashboardStats)
        queryClient.invalidateQueries(ORDER_QUERY_KEYS.chartData)
        queryClient.invalidateQueries(['notifications'])
        
        if (response.success) {
          console.log('Order updated successfully!')
        }
      },
      onError: (error: any) => {
        console.error('Update order error:', error)
      }
    }
  )
}

export const useCancelOrder = () => {
  const queryClient = useQueryClient()

  return useMutation(
    ({ orderId, reason }: { orderId: number; reason?: string }) =>
      orderService.cancelOrder(orderId, reason),
    {
      onSuccess: (response, { orderId }) => {
        // Invalidate all related queries
        queryClient.invalidateQueries(ORDER_QUERY_KEYS.orders)
        queryClient.invalidateQueries(ORDER_QUERY_KEYS.order(orderId))
        queryClient.invalidateQueries(ORDER_QUERY_KEYS.dashboardStats)
        queryClient.invalidateQueries(ORDER_QUERY_KEYS.chartData)
        queryClient.invalidateQueries(['notifications'])
        
        if (response.success) {
          console.log('Order cancelled successfully!')
        }
      },
      onError: (error: any) => {
        console.error('Cancel order error:', error)
      }
    }
  )
}

export const useUploadOrderFiles = () => {
  const queryClient = useQueryClient()

  return useMutation(
    ({ orderId, files }: { orderId: number; files: File[] }) =>
      orderService.uploadOrderFiles(orderId, files),
    {
      onSuccess: (response, { orderId }) => {
        // Invalidate related queries
        queryClient.invalidateQueries(ORDER_QUERY_KEYS.order(orderId))
        
        if (response.success) {
          console.log('Files uploaded successfully!')
        }
      },
      onError: (error: any) => {
        console.error('Upload files error:', error)
      }
    }
  )
}

export const useReorder = () => {
  const queryClient = useQueryClient()

  return useMutation(
    (orderId: number) => orderService.reorder(orderId),
    {
      onSuccess: (response) => {
        // Invalidate all related queries
        queryClient.invalidateQueries(ORDER_QUERY_KEYS.orders)
        queryClient.invalidateQueries(ORDER_QUERY_KEYS.dashboardStats)
        queryClient.invalidateQueries(ORDER_QUERY_KEYS.chartData)
        
        if (response.success) {
          console.log('Order reordered successfully!')
        }
      },
      onError: (error: any) => {
        console.error('Reorder error:', error)
      }
    }
  )
}

export const useGetEstimate = () => {
  return useMutation(
    (orderData: Partial<CreateOrderData>) => orderService.getEstimate(orderData),
    {
      onError: (error: any) => {
        console.error('Get estimate error:', error)
      }
    }
  )
}

export const useDeleteOrderFile = () => {
  const queryClient = useQueryClient()

  return useMutation(
    ({ orderId, fileId }: { orderId: number; fileId: number }) =>
      orderService.deleteOrderFile(orderId, fileId),
    {
      onSuccess: (response, { orderId }) => {
        // Invalidate related queries to refresh the order data
        queryClient.invalidateQueries(ORDER_QUERY_KEYS.order(orderId))
        
        if (response.success) {
          console.log('File deleted successfully!')
        }
      },
      onError: (error: any) => {
        console.error('Delete file error:', error)
      }
    }
  )
}

export const useDownloadOrderFile = () => {
  return useMutation(
    ({ orderId, fileId, fileName }: { orderId: number; fileId: number; fileName: string }) =>
      orderService.downloadOrderFile(orderId, fileId, fileName),
    {
      onSuccess: () => {
        console.log('File download started!')
      },
      onError: (error: any) => {
        console.error('Download file error:', error)
      }
    }
  )
}

// Hook for sending order messages
export const useSendOrderMessage = () => {
  const queryClient = useQueryClient()

  return useMutation(
    ({ orderId, message }: { orderId: number; message: string }) =>
      orderService.sendOrderMessage(orderId, message),
    {
      onSuccess: (response, { orderId }) => {
        // Invalidate messages query to refresh
        queryClient.invalidateQueries(['orderMessages', orderId])
        queryClient.invalidateQueries(ORDER_QUERY_KEYS.order(orderId))
        console.log('Message sent successfully!')
      },
      onError: (error: any) => {
        console.error('Send message error:', error)
      }
    }
  )
}

// Hook for fetching order messages
export const useOrderMessages = (orderId: number) => {
  return useQuery(
    ['orderMessages', orderId],
    () => orderService.getOrderMessages(orderId),
    {
      enabled: !!orderId,
      staleTime: 30000, // 30 seconds
      refetchInterval: 60000, // Refresh every minute
      retry: 2,
      onError: (error: any) => {
        console.error('Order messages fetch error:', error)
      }
    }
  )
} 