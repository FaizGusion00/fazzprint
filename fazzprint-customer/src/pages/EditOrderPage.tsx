import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft,
  Save,
  X,
  AlertCircle,
  Upload,
  Trash2,
  CalendarDays
} from 'lucide-react'
import { useOrder, useUpdateOrder, useUploadOrderFiles } from '@/hooks/useOrders'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

const EditOrderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const { data: response, isLoading } = useOrder(Number(id))
  const updateOrderMutation = useUpdateOrder()
  const uploadFilesMutation = useUploadOrderFiles()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quantity: 1,
    design_requirements: '',
    special_instructions: '',
    due_date: ''
  })

  const [newFiles, setNewFiles] = useState<File[]>([])
  const [filesToDelete, setFilesToDelete] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const order = response?.data?.job_order

  useEffect(() => {
    if (order) {
      setFormData({
        title: order.title || '',
        description: order.description || '',
        quantity: order.quantity || 1,
        design_requirements: order.design_requirements || '',
        special_instructions: order.special_instructions || '',
        due_date: order.due_date ? new Date(order.due_date).toISOString().split('T')[0] : ''
      })
    }
  }, [order])

  if (!id) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Order ID</h2>
        <Link to="/orders" className="text-primary-600 hover:text-primary-500">
        
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return <LoadingSpinner text="Loading order..." />
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
        <Link to="/orders" className="btn btn-primary">
          
        </Link>
      </div>
    )
  }

  if (order.status !== 'draft') {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Cannot Edit Order</h2>
        <p className="text-gray-600 mb-4">
          This order can no longer be edited as it has already been processed.
        </p>
        <Link to={`/orders/${order.job_order_id}`} className="btn btn-primary">
          View Order Details
        </Link>
      </div>
    )
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(1, parseInt(e.target.value) || 1)
    setFormData(prev => ({ ...prev, quantity: value }))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      setNewFiles(prev => [...prev, ...selectedFiles])
    }
  }

  const removeNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index))
  }

  const markFileForDeletion = (fileId: number) => {
    setFilesToDelete(prev => [...prev, fileId])
  }

  const unmarkFileForDeletion = (fileId: number) => {
    setFilesToDelete(prev => prev.filter(id => id !== fileId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Update order details
      await updateOrderMutation.mutateAsync({
        orderId: order.job_order_id,
        orderData: formData
      })

      // Upload new files if any
      if (newFiles.length > 0) {
        await uploadFilesMutation.mutateAsync({
          orderId: order.job_order_id,
          files: newFiles
        })
      }

      // TODO: Delete marked files (need backend endpoint)
      if (filesToDelete.length > 0) {
        console.log('Files to delete:', filesToDelete)
        // await deleteFilesMutation.mutateAsync({ orderId: order.job_order_id, fileIds: filesToDelete })
      }

      toast.success('Order updated successfully!')
      navigate(`/orders/${order.job_order_id}`)
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Failed to update order')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/orders/${order.job_order_id}`)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
        
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Order</h1>
            <p className="text-sm text-gray-500">Order #{order.job_order_url}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Order Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Order Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Order Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter order title"
              />
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleQuantityChange}
                min="1"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe what you need printed"
              />
            </div>

            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">
                <CalendarDays className="h-4 w-4 inline mr-1" />
                Due Date (Optional)
              </label>
              <input
                type="date"
                id="due_date"
                name="due_date"
                value={formData.due_date}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Requirements & Instructions</h2>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="design_requirements" className="block text-sm font-medium text-gray-700 mb-1">
                Design Requirements
              </label>
              <textarea
                id="design_requirements"
                name="design_requirements"
                value={formData.design_requirements}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Specify design requirements, colors, sizes, etc."
              />
            </div>

            <div>
              <label htmlFor="special_instructions" className="block text-sm font-medium text-gray-700 mb-1">
                Special Instructions
              </label>
              <textarea
                id="special_instructions"
                name="special_instructions"
                value={formData.special_instructions}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Any special instructions or notes"
              />
            </div>
          </div>
        </div>

        {/* Files Management */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Files</h2>
          
          {/* Existing Files */}
          {order.order_files && order.order_files.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Current Files</h3>
              <div className="space-y-2">
                {order.order_files.map((file: any) => (
                  <div
                    key={file.file_id}
                    className={`flex items-center justify-between p-3 border rounded-lg ${
                      filesToDelete.includes(file.file_id)
                        ? 'border-red-200 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{file.file_name}</p>
                      <p className="text-xs text-gray-500">
                        {file.file_type?.toUpperCase()} • {formatFileSize(file.file_size)}
                      </p>
                    </div>
                    
                    {filesToDelete.includes(file.file_id) ? (
                      <button
                        type="button"
                        onClick={() => unmarkFileForDeletion(file.file_id)}
                        className="text-sm text-green-600 hover:text-green-700"
                      >
                        Keep File
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => markFileForDeletion(file.file_id)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Files */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Add New Files</h3>
            
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-4 text-gray-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF, AI, PSD, etc. (Max 10MB each)</p>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="*/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* Selected New Files */}
            {newFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                {newFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-green-200 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeNewFile(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end space-x-3">
          <Link
            to={`/orders/${order.job_order_id}`}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditOrderPage 