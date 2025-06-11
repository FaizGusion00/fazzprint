import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Calendar, 
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Package,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react'
import { useOrders } from '@/hooks/useOrders'
import { OrderFilters } from '@/services/orderService'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useToast } from '@/contexts/ToastContext'
import OrderStatusBadge from '@/components/OrderStatusBadge'

const OrdersPage: React.FC = () => {
  const { showSuccess } = useToast()
  const [currentPage, setCurrentPage] = useState(1)
  const [copiedText, setCopiedText] = useState<string>('')
  const [filters, setFilters] = useState<OrderFilters>({
    status: '',
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc'
  })

  // Use React Query hook for data fetching
  const { data: response, isLoading, refetch } = useOrders({
    ...filters,
    page: currentPage,
    per_page: 10
  })

  const orders = response?.data?.orders || []
  const totalPages = response?.data?.pagination?.last_page || 1

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle
      case 'in_progress':
        return Clock
      case 'started':
        return Package
      default:
        return AlertCircle
    }
  }

  const handleFilterChange = (key: keyof OrderFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filtering
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    refetch()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isOverdue = (dueDate: string | undefined) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(text)
      showSuccess('Copied!', `${label} copied to clipboard`)
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedText('')
      }, 2000)
    } catch (error) {
      showSuccess('Copied!', `${label}: ${text}`) // Fallback notification
    }
  }

  if (isLoading) {
    return <LoadingSpinner text="Loading orders..." />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and track all your printing orders
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={() => {
              refetch()
              showSuccess('Orders Refreshed', 'Your orders list has been updated successfully.')
            }}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <Link
            to="/orders/create"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Orders
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  id="search"
                  className="input pl-10"
                  placeholder="Search by title, order ID..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                className="input"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending">Pending Payment</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                id="sort"
                className="input"
                value={`${filters.sort_by}-${filters.sort_order}`}
                onChange={(e) => {
                  const [sort_by, sort_order] = e.target.value.split('-')
                  setFilters(prev => ({ ...prev, sort_by, sort_order: sort_order as 'asc' | 'desc' }))
                }}
              >
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
                <option value="due_date-asc">Due Date (Earliest)</option>
                <option value="due_date-desc">Due Date (Latest)</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {orders.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tracking ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => {
                      const StatusIcon = getStatusIcon(order.status)
                      const overdue = isOverdue(order.due_date)
                      
                      return (
                        <tr key={order.job_order_id} className="hover:bg-gray-50">
                          {/* Tracking ID Column */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-mono text-gray-900">
                                {(order as any).tracking_id || `${order.job_order_id}`}
                              </span>
                              <button
                                onClick={() => copyToClipboard(
                                  (order as any).tracking_id || `${order.job_order_id}`, 
                                  'Tracking ID'
                                )}
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Copy tracking ID"
                              >
                                {copiedText === ((order as any).tracking_id || `${order.job_order_id}`) ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                          
                          {/* Order Column */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <StatusIcon className="h-5 w-5 text-gray-400" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {order.title}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-mono text-gray-500">
                                    {order.job_order_url}
                                  </span>
                                  <button
                                    onClick={() => copyToClipboard(order.job_order_url, 'Order URL')}
                                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Copy order URL"
                                  >
                                    {copiedText === order.job_order_url ? (
                                      <Check className="h-3 w-3 text-green-500" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-4 py-4 whitespace-nowrap">
                            <OrderStatusBadge 
                              status={order.status as 'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled'} 
                              size="sm"
                            />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.quantity.toLocaleString()}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.due_date ? (
                              <div className={`flex items-center ${overdue ? 'text-red-600' : ''}`}>
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDate(order.due_date)}
                                {overdue && <span className="ml-1 text-xs">(Overdue)</span>}
                              </div>
                            ) : (
                              <span className="text-gray-400">No due date</span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(order.created_at)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              to={`/orders/${order.job_order_id}`}
                              className="text-primary-600 hover:text-primary-500 inline-flex items-center"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {orders.map((order) => {
                const StatusIcon = getStatusIcon(order.status)
                const overdue = isOverdue(order.due_date)
                
                return (
                  <div key={order.job_order_id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <StatusIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {order.title}
                          </h3>
                          <div className="flex items-center space-x-1 mt-1">
                            <span className="text-xs font-mono text-gray-500">
                              {order.job_order_url}
                            </span>
                            <button
                              onClick={() => copyToClipboard(order.job_order_url, 'Order URL')}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
                              title="Copy order URL"
                            >
                              {copiedText === order.job_order_url ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                      <OrderStatusBadge 
                        status={order.status as 'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled'} 
                        size="sm"
                      />
                    </div>

                    {/* Tracking ID */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Tracking ID</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-mono text-gray-900">
                            {(order as any).tracking_id || `TRK-${order.job_order_id}`}
                          </span>
                          <button
                            onClick={() => copyToClipboard(
                              (order as any).tracking_id || `TRK-${order.job_order_id}`, 
                              'Tracking ID'
                            )}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors touch-manipulation"
                            title="Copy tracking ID"
                          >
                            {copiedText === ((order as any).tracking_id || `TRK-${order.job_order_id}`) ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <div className="text-xs text-gray-500">Quantity</div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.quantity.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Created</div>
                        <div className="text-sm text-gray-900">
                          {formatDate(order.created_at)}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-gray-500">Due Date</div>
                        <div className={`text-sm ${overdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                          {order.due_date ? (
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(order.due_date)}
                              {overdue && <span className="ml-1 text-xs">(Overdue)</span>}
                            </div>
                          ) : (
                            'No due date set'
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex justify-end">
                      <Link
                        to={`/orders/${order.job_order_id}`}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 touch-manipulation"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Page <span className="font-medium">{currentPage}</span> of{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.search || filters.status 
                ? 'Try adjusting your search or filters' 
                : 'Get started by creating your first print order'
              }
            </p>
            <div className="mt-6">
              <Link
                to="/orders/create"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Order
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default OrdersPage 