import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Search, 
  CheckCircle, 
  AlertCircle,
  MapPin,
  Calendar,
  User,
  FileText,
  RefreshCw,
  Eye,
  X,
  Edit,
  DollarSign,
  CreditCard,
  AlertTriangle
} from 'lucide-react'
import { useQuery } from 'react-query'
import { orderService } from '@/services/orderService'
import { useCancelOrder } from '@/hooks/useOrders'
import LoadingSpinner from '@/components/LoadingSpinner'
import FileViewer from '@/components/FileViewer'
import OrderStatusBadge from '@/components/OrderStatusBadge'
import OrderTimeline from '@/components/OrderTimeline'
import { useToast } from '@/contexts/ToastContext'

const TrackOrderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchOrderId, setSearchOrderId] = useState('')
  const [showCancelModal, setShowCancelModal] = useState(false)
  const { showSuccess, showError } = useToast()

  // Track order query - use specific order tracking for accurate per-order data
  const { 
    data: trackingResponse, 
    isLoading, 
    error,
    refetch 
  } = useQuery(
    ['trackOrder', id],
    () => orderService.getOrderTracking(Number(id)),
    {
      enabled: !!id && !isNaN(Number(id)),
      staleTime: 10000, // 10 seconds - fresher data for tracking
      refetchInterval: 15000, // Refetch every 15 seconds for real-time updates
      refetchIntervalInBackground: true,
      retry: 2,
      onError: (error: any) => {
        showError('Tracking Error', 'Failed to load tracking information')
        console.error('Track order error:', error)
      }
    }
  )

  // Cancel order mutation
  const cancelOrderMutation = useCancelOrder()

  const trackingData = trackingResponse?.data

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchOrderId.trim()) {
      navigate(`/track/${searchOrderId.trim()}`)
    }
  }

  const handleRefresh = () => {
    refetch()
    showSuccess('Refreshed', 'Tracking information refreshed')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount)
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100'
      case 'partial':
        return 'text-yellow-600 bg-yellow-100'
      case 'pending':
        return 'text-red-600 bg-red-100'
      case 'refunded':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const handleCancelOrder = () => {
    setShowCancelModal(true)
  }

  const confirmCancelOrder = () => {
    if (job_order) {
      cancelOrderMutation.mutate(
        { 
          orderId: job_order.job_order_id, 
          reason: 'Cancelled by customer' 
        },
        {
          onSuccess: () => {
            showSuccess('Order Cancelled', 'Order cancelled successfully')
            setShowCancelModal(false)
            refetch()
          },
          onError: (error: any) => {
            showError('Cancel Failed', error.response?.data?.message || 'Failed to cancel order')
          }
        }
      )
    }
  }

  const handleEditOrder = () => {
    navigate(`/orders/${job_order.job_order_id}/edit`)
  }

  if (isLoading) {
    return <LoadingSpinner text="Loading tracking information..." />
  }

  if (error || !trackingData) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Track Your Order</h1>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Enter order ID, tracking ID, or order URL"
                value={searchOrderId}
                onChange={(e) => setSearchOrderId(e.target.value)}
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">
                You can search by order ID, tracking ID from order_trackings table, or order URL
              </p>
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-md"
            >
              <Search className="h-4 w-4 mr-2" />
              Track Order
            </button>
          </form>
        </div>

        {/* Error State */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Order Not Found</h3>
          <p className="text-gray-500 mb-6">
            {id ? 
              'The order you\'re looking for could not be found or you don\'t have permission to view it.' :
              'Please enter an order ID to track your order.'
            }
          </p>
          <button
            onClick={() => navigate('/orders')}
            className="btn btn-primary btn-md"
          >
            View My Orders
          </button>
        </div>
      </div>
    )
  }

  const { job_order, tracking_history, progress, next_steps, can_cancel } = trackingData

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Track Order</h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time tracking for order #{job_order.job_order_url}
          </p>
        </div>
        <div className="mt-4 lg:mt-0 flex gap-3">
          <button
            onClick={handleRefresh}
            className="btn btn-outline btn-md"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => navigate(`/orders/${job_order.job_order_id}`)}
            className="btn btn-secondary btn-md"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </button>
        </div>
      </div>

      {/* Search Alternative Orders */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Track another order by ID, tracking ID, or URL"
              value={searchOrderId}
              onChange={(e) => setSearchOrderId(e.target.value)}
              className="input"
            />
          </div>
          <button
            type="submit"
            className="btn btn-outline btn-md"
          >
            <Search className="h-4 w-4 mr-2" />
            Track
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Tracking Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Order Overview</h2>
              <OrderStatusBadge 
                status={job_order.status as 'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled'}
                size="md"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Order Title</h3>
                <p className="text-base text-gray-900">{job_order.title}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Quantity</h3>
                <p className="text-base text-gray-900">{job_order.quantity.toLocaleString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Order Date</h3>
                <p className="text-base text-gray-900">{formatDate(job_order.created_at)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                <p className="text-base text-gray-900">
                  {job_order.due_date ? formatDate(job_order.due_date) : 'Not specified'}
                </p>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Payment Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Payment Status</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor((job_order as any).payment_status || 'pending')}`}>
                    {((job_order as any).payment_status || 'pending').replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                {(job_order as any).estimated_price && (
                  <div>
                    <p className="text-xs text-gray-500">Estimated Price <span className="text-yellow-600">(Reference)</span></p>
                    <p className="text-sm font-medium text-gray-600">{formatCurrency((job_order as any).estimated_price)}</p>
                    <p className="text-xs text-gray-400">System calculation only</p>
                  </div>
                )}
                {(job_order as any).quoted_price && (
                  <div>
                    <p className="text-xs text-gray-500">Quoted Price <span className="text-blue-600">(Official)</span></p>
                    <p className="text-sm font-medium text-blue-900">{formatCurrency((job_order as any).quoted_price)}</p>
                    <p className="text-xs text-gray-400">By sales manager</p>
                  </div>
                )}
                {(job_order as any).final_price && (
                  <div>
                    <p className="text-xs text-gray-500">Final Price <span className="text-green-600">(Agreed)</span></p>
                    <p className="text-sm font-medium text-green-900">{formatCurrency((job_order as any).final_price)}</p>
                    <p className="text-xs text-gray-400">After negotiation</p>
                  </div>
                )}
                {(job_order as any).amount_paid > 0 && (
                  <div>
                    <p className="text-xs text-gray-500">Amount Paid</p>
                    <p className="text-sm font-medium text-green-600">{formatCurrency((job_order as any).amount_paid)}</p>
                  </div>
                )}
                {(job_order as any).balance_due > 0 && (
                  <div>
                    <p className="text-xs text-gray-500">Balance Due</p>
                    <p className="text-sm font-medium text-red-600">{formatCurrency((job_order as any).balance_due)}</p>
                  </div>
                )}
                {(job_order as any).payment_due_date && (
                  <div>
                    <p className="text-xs text-gray-500">Payment Due</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate((job_order as any).payment_due_date)}</p>
                  </div>
                )}
              </div>
              {(job_order as any).payment_notes && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500">Payment Notes</p>
                  <p className="text-sm text-gray-700">{(job_order as any).payment_notes}</p>
                </div>
              )}
              
              {/* Payment Status Messages */}
              {((job_order as any).payment_status === 'pending' || !(job_order as any).payment_status) && !(job_order as any).quoted_price && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-blue-600 mr-2" />
                    <p className="text-sm text-blue-800">
                      Waiting for sales manager to review and provide official quote. The estimated price is for reference only.
                    </p>
                  </div>
                </div>
              )}
              
              {((job_order as any).payment_status === 'pending' || !(job_order as any).payment_status) && (job_order as any).quoted_price && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center">
                    <CreditCard className="h-4 w-4 text-yellow-600 mr-2" />
                    <p className="text-sm text-yellow-800">
                      <strong>Payment Required:</strong> Please transfer {formatCurrency((job_order as any).quoted_price)} to proceed. 
                      Contact sales manager for payment details.
                    </p>
                  </div>
                </div>
              )}
              
              {(job_order as any).payment_status === 'paid' && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    <p className="text-sm text-green-800">
                      Payment confirmed! Your order will begin processing shortly.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm text-gray-500">{progress.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Completed Steps:</span>
                <span className="ml-2 font-medium">{progress.completed_steps} / {progress.total_steps}</span>
              </div>
              <div>
                <span className="text-gray-500">Estimated Completion:</span>
                <span className="ml-2 font-medium">
                  {progress.estimated_completion ? 
                    formatDate(progress.estimated_completion) : 
                    'TBD'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Tracking Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Tracking Timeline</h2>
            
            <div className="flow-root">
              <ul className="-mb-8">
                {tracking_history.map((event: any, eventIdx: number) => (
                  <li key={eventIdx}>
                    <div className="relative pb-8">
                      {eventIdx !== tracking_history.length - 1 ? (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`
                            h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white
                            ${event.status === 'completed' ? 'bg-green-500' : 
                              event.status === 'in_progress' ? 'bg-blue-500' : 
                              event.status === 'started' ? 'bg-yellow-500' : 
                              'bg-gray-400'}
                          `}>
                            <CheckCircle className="h-4 w-4 text-white" />
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {event.event}
                            </p>
                            <p className="text-sm text-gray-500">
                              {event.description}
                            </p>
                            {event.quantity_completed && (
                              <p className="text-sm text-gray-500">
                                Quantity completed: {event.quantity_completed}
                              </p>
                            )}
                            {event.quality_notes && (
                              <p className="text-sm text-gray-500">
                                Notes: {event.quality_notes}
                              </p>
                            )}
                          </div>
                          <div className="whitespace-nowrap text-right text-sm text-gray-500">
                            <time dateTime={event.timestamp}>
                              {formatDate(event.timestamp)}
                            </time>
                            {event.progress_percentage && (
                              <p className="text-xs text-gray-400">
                                {event.progress_percentage}% complete
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Next Steps */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Next Steps</h3>
            {next_steps.length > 0 ? (
              <div className="space-y-3">
                {next_steps.map((step: any, index: number) => (
                  <div key={index} className="border-l-4 border-primary-500 pl-4">
                    <h4 className="text-sm font-medium text-gray-900">{step.step}</h4>
                    <p className="text-sm text-gray-500">{step.description}</p>
                    <p className="text-xs text-gray-400">ETA: {step.estimated_time}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No pending steps</p>
            )}
          </div>

          {/* Order Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/orders/${job_order.job_order_id}`)}
                className="w-full btn btn-outline btn-md"
              >
                <FileText className="h-4 w-4 mr-2" />
                View Full Details
              </button>
              
              {job_order.status === 'draft' && (
                <button
                  onClick={handleEditOrder}
                  className="w-full btn btn-secondary btn-md"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Order
                </button>
              )}
              
              {job_order.order_files && job_order.order_files.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Order Files ({job_order.order_files.length})</h4>
                  {job_order.order_files.slice(0, 3).map((file: any) => (
                    <FileViewer 
                      key={file.file_id}
                      file={file}
                      orderId={job_order.job_order_id}
                      canDelete={false}
                      showDeleteButton={false}
                    />
                  ))}
                  {job_order.order_files.length > 3 && (
                    <p className="text-xs text-gray-500 mt-2">
                      +{job_order.order_files.length - 3} more files (view full details for all files)
                    </p>
                  )}
                </div>
              )}

              {can_cancel && (
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelOrderMutation.isLoading}
                  className="w-full btn bg-red-600 text-white hover:bg-red-700 btn-md disabled:opacity-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  {cancelOrderMutation.isLoading ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )}
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Need Help?</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center text-gray-600">
                <User className="h-4 w-4 mr-2" />
                <span>Customer Support</span>
              </div>
              <div className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-2" />
                <span>support@fazzprint.com</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Mon-Fri, 9AM-6PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Cancel Order
                </h3>
                <div className="mt-4 px-7 py-3">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to cancel this order? This action cannot be undone and you may not be able to recover your order.
                  </p>
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-xs text-yellow-800">
                      <strong>Order:</strong> {job_order?.title}<br/>
                      <strong>Quantity:</strong> {job_order?.quantity.toLocaleString()}<br/>
                      <strong>Status:</strong> {job_order?.status.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 px-7 py-3">
                  <button
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    disabled={cancelOrderMutation.isLoading}
                  >
                    Keep Order
                  </button>
                  <button
                    onClick={confirmCancelOrder}
                    disabled={cancelOrderMutation.isLoading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancelOrderMutation.isLoading ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Cancelling...
                      </span>
                    ) : (
                      'Yes, Cancel Order'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrackOrderPage 