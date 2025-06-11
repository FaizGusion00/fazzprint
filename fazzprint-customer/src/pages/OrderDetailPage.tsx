import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft,
  FileText,
  Eye,
  Edit3,
  RefreshCw,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  User,
  Phone,
  Mail,
  Upload,
  MessageSquare,
  X,
  AlertTriangle
} from 'lucide-react'
import { useOrder, useUploadOrderFiles, useCancelOrder, useUpdateOrder, useSendOrderMessage, useOrderMessages } from '@/hooks/useOrders'
import LoadingSpinner from '@/components/LoadingSpinner'
import FileViewer from '@/components/FileViewer'
import OrderStatusBadge from '@/components/OrderStatusBadge'
import OrderTimeline from '@/components/OrderTimeline'
import { useToast } from '@/contexts/ToastContext'

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'tracking' | 'communications'>('overview')
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const { showSuccess, showError } = useToast()

  const { data: response, isLoading, error, refetch } = useOrder(Number(id))
  const uploadFilesMutation = useUploadOrderFiles()
  const cancelOrderMutation = useCancelOrder()
  const updateOrderMutation = useUpdateOrder()
  const sendOrderMessageMutation = useSendOrderMessage()
  const { data: messagesResponse, refetch: refetchMessages } = useOrderMessages(Number(id))
  
  // Message state
  const [messageText, setMessageText] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)

  if (!id) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Order ID</h2>
        
      </div>
    )
  }

  if (isLoading) {
    return <LoadingSpinner text="Loading order details..." />
  }

  if (error || !response?.data?.job_order) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
        <p className="text-gray-600 mb-4">
          The order you're looking for doesn't exist or you don't have permission to view it.
        </p>
       
      </div>
    )
  }

  const { job_order: order, status_info } = response.data

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle
      case 'in_progress':
        return Clock
      case 'started':
        return Package
      case 'cancelled':
        return XCircle
      default:
        return AlertCircle
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'in_progress':
        return 'text-blue-600 bg-blue-100'
      case 'started':
        return 'text-yellow-600 bg-yellow-100'
      case 'draft':
        return 'text-gray-600 bg-gray-100'
      case 'cancelled':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const handleRefresh = () => {
    refetch()
    showSuccess('Order Refreshed', 'Order details refreshed successfully')
  }

  const handleCancelOrder = () => {
    setShowCancelModal(true)
  }

  const confirmCancelOrder = () => {
    if (order) {
      cancelOrderMutation.mutate(
        { 
          orderId: order.job_order_id, 
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    const files = Array.from(e.target.files)
    setUploadingFiles(true)
    
    try {
      await uploadFilesMutation.mutateAsync({
        orderId: order?.job_order_id!,
        files
      })
      refetch() // Refresh order data to show new files
      e.target.value = '' // Reset input
    } catch (error) {
      console.error('Upload error:', error)
      showError('Upload Failed', 'Failed to upload files. Please try again.')
    } finally {
      setUploadingFiles(false)
    }
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || !order) return
    
    setSendingMessage(true)
    
    try {
      await sendOrderMessageMutation.mutateAsync({
        orderId: order.job_order_id,
        message: messageText.trim()
      })
      setMessageText('')
      refetchMessages()
      showSuccess('Message Sent', 'Your message has been sent successfully')
    } catch (error: any) {
      showError('Send Failed', error.response?.data?.message || 'Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  const StatusIcon = getStatusIcon(order.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
           
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{order.title}</h1>
            <p className="text-sm text-gray-500">Order #{order.job_order_url}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </button>
          
          {order.status === 'draft' && (
            <Link
              to={`/orders/${order.job_order_id}/edit`}
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Edit Order
            </Link>
          )}

          {(order.status === 'draft' || order.status === 'pending') && (
            <button
              onClick={handleCancelOrder}
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel Order
            </button>
          )}
          
          <Link
            to={`/track/${order.job_order_id}`}
            className="flex items-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100"
          >
            <Eye className="h-4 w-4 mr-1" />
            Track Order
          </Link>
        </div>
      </div>

      {/* Order Status and Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <StatusIcon className="h-8 w-8 text-gray-600" />
              <div>
                <h2 className="text-lg font-medium text-gray-900">Current Status</h2>
                <OrderStatusBadge 
                  status={order.status as 'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled'}
                  showDescription={true}
                  size="lg"
                />
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p className="text-sm text-gray-900">{formatDate(order.updated_at)}</p>
            </div>
          </div>

          {/* Progress Info */}
          {status_info && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Current Phase</p>
                  <p className="text-sm text-gray-900">{status_info.current_phase || 'Initial'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Progress</p>
                  <p className="text-sm text-gray-900">{status_info.progress_percentage || 0}% Complete</p>
                </div>
              </div>
              {order.due_date && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-500">Estimated Completion</p>
                  <p className="text-sm text-gray-900">{formatDate(order.due_date)}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Order Timeline */}
        <OrderTimeline 
          currentStatus={order.status as 'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled'} 
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { key: 'overview', label: 'Overview', icon: FileText },
              { key: 'files', label: 'Files', icon: Upload },
              { key: 'tracking', label: 'Tracking', icon: Package },
              { key: 'communications', label: 'Communications', icon: MessageSquare }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Order Information */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Order Information</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Title</dt>
                      <dd className="text-sm text-gray-900">{order.title}</dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Description</dt>
                      <dd className="text-sm text-gray-900">{order.description || 'No description provided'}</dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Quantity</dt>
                      <dd className="text-sm text-gray-900">{order.quantity.toLocaleString()}</dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Order Date</dt>
                      <dd className="text-sm text-gray-900">{formatDate(order.created_at)}</dd>
                    </div>
                    
                    {order.due_date && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Due Date</dt>
                        <dd className="text-sm text-gray-900">{formatDate(order.due_date)}</dd>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Information */}
                {order.customer && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Customer Information</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{order.customer.full_name}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{order.customer.email}</span>
                      </div>
                      
                      {order.customer.phone_number && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{order.customer.phone_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Requirements */}
              {(order.design_requirements || order.special_instructions) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Requirements & Instructions</h3>
                  
                  {order.design_requirements && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 mb-1">Design Requirements</dt>
                      <dd className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                        {order.design_requirements}
                      </dd>
                    </div>
                  )}
                  
                  {order.special_instructions && (
    <div>
                      <dt className="text-sm font-medium text-gray-500 mb-1">Special Instructions</dt>
                      <dd className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                        {order.special_instructions}
                      </dd>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Files Tab */}
          {activeTab === 'files' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Order Files</h3>
                {order.status === 'draft' && (
                  <div>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      accept="*/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className={`btn btn-outline btn-sm cursor-pointer ${uploadingFiles ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      {uploadingFiles ? 'Uploading...' : 'Upload File'}
                    </label>
                  </div>
                )}
              </div>

              {order.order_files && order.order_files.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {order.order_files.map((file: any) => (
                    <FileViewer 
                      key={file.file_id} 
                      file={file} 
                      orderId={order.job_order_id}
                      canDelete={order.status === 'draft'}
                      showDeleteButton={order.status === 'draft'}
                      onDeleted={() => refetch()}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No files uploaded</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {order.status === 'draft' 
                      ? 'Upload design files or reference materials for your order.'
                      : 'No files were uploaded for this order.'
                    }
                  </p>
                  {order.status === 'draft' && (
                    <div className="mt-6">
                      <label
                        htmlFor="file-upload-empty"
                        className={`btn btn-primary cursor-pointer ${uploadingFiles ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingFiles ? 'Uploading...' : 'Upload Files'}
                      </label>
                      <input
                        id="file-upload-empty"
                        type="file"
                        multiple
                        accept="*/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tracking Tab */}
          {activeTab === 'tracking' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Order Tracking & Progress</h3>
                <Link 
                  to={`/track/${order.job_order_id}`}
                  className="text-sm text-primary-600 hover:text-primary-500 flex items-center"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Full Tracking
                </Link>
              </div>
              
              {/* Order Timeline */}
              <OrderTimeline 
                currentStatus={order.status as 'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled'} 
              />

              {/* Quick Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Order Created</p>
                      <p className="text-sm text-gray-900">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                </div>

                {order.status !== 'draft' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <Package className="h-6 w-6 text-blue-500" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-500">Last Updated</p>
                        <p className="text-sm text-gray-900">{formatDate(order.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {order.due_date && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <Clock className="h-6 w-6 text-yellow-500" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-500">Due Date</p>
                        <p className="text-sm text-gray-900">{formatDate(order.due_date)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Communications Tab */}
          {activeTab === 'communications' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Communications</h3>
                <div className="text-sm text-gray-500">
                  {messagesResponse?.data?.remaining_messages_today !== undefined && (
                    <span>
                      {messagesResponse.data.remaining_messages_today} messages remaining today
                    </span>
                  )}
                </div>
              </div>

              {/* Send Message Form */}
              {messagesResponse?.data?.can_send_message && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Send Message</h4>
                  <div className="space-y-3">
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type your message here... (max 2 messages per day per order)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      rows={4}
                      maxLength={1000}
                      disabled={sendingMessage}
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {messageText.length}/1000 characters
                      </span>
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim() || sendingMessage}
                        className="btn btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingMessage ? (
                          <span className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Sending...
                          </span>
                        ) : (
                          <>
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Send Message
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Daily Limit Info */}
              {!messagesResponse?.data?.can_send_message && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-900">Daily Message Limit Reached</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        You can send up to 2 messages per day per order. Please try again tomorrow.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages History */}
              <div className="space-y-4">
                <h4 className="text-base font-medium text-gray-900">Message History</h4>
                
                {messagesResponse?.data?.messages && messagesResponse.data.messages.length > 0 ? (
                  <div className="space-y-3">
                    {messagesResponse.data.messages.map((message: any) => (
                      <div key={message.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                message.sender_type === 'customer' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {message.sender_type === 'customer' ? 'You' : 'FazzPrint Team'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(message.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-900 whitespace-pre-wrap">
                              {message.message}
                            </p>
                            {message.response && (
                              <div className="mt-3 pl-4 border-l-2 border-gray-200">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    FazzPrint Response
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {formatDate(message.response_date)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                  {message.response}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <MessageSquare className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <h3 className="text-sm font-medium text-gray-900">No messages yet</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Start a conversation about your order. You can send up to 2 messages per day.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
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
                      <strong>Order:</strong> {order?.title}<br/>
                      <strong>Quantity:</strong> {order?.quantity.toLocaleString()}<br/>
                      <strong>Status:</strong> {order?.status.replace('_', ' ')}
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

export default OrderDetailPage 