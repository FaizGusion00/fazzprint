import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { 
  Upload, 
  X, 
  FileText, 
  Image, 
  Save,
  Calculator
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { CreateOrderData } from '@/types'
import { useCreateOrder, useGetEstimate } from '@/hooks/useOrders'
import toast from 'react-hot-toast'

const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate()
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [estimate, setEstimate] = useState<any>(null)
  
  const createOrderMutation = useCreateOrder()
  const getEstimateMutation = useGetEstimate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<CreateOrderData>()

  const watchedFields = watch()

  // File upload configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp', '.svg'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar'],
      'application/x-photoshop': ['.psd'],
      'application/postscript': ['.ai', '.eps']
    },
    maxFiles: 15,
    maxSize: 50 * 1024 * 1024, // 50MB per file
    onDrop: (acceptedFiles) => {
      setUploadedFiles(prev => [...prev, ...acceptedFiles])
      toast.success(`${acceptedFiles.length} file(s) added`)
    },
    onDropRejected: (rejectedFiles) => {
      rejectedFiles.forEach(rejection => {
        const errors = rejection.errors.map(e => e.message).join(', ')
        toast.error(`File ${rejection.file.name}: ${errors}`)
      })
    }
  })

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-5 w-5 text-blue-500" />
    }
    return <FileText className="h-5 w-5 text-gray-500" />
  }

  const handleGetEstimate = async () => {
    if (!watchedFields.title || !watchedFields.quantity) {
      toast.error('Please fill in title and quantity to get an estimate')
      return
    }

    try {
      const response = await getEstimateMutation.mutateAsync(watchedFields)
      if (response.success && response.data) {
        setEstimate(response.data)
        toast.success('Estimate calculated successfully!')
      }
    } catch (error) {
      console.error('Failed to get estimate:', error)
    }
  }

  const onSubmit = async (data: CreateOrderData) => {
    try {
      // Add files to the form data
      const formDataWithFiles = {
        ...data,
        files: uploadedFiles
      }

      const response = await createOrderMutation.mutateAsync(formDataWithFiles)
      
      if (response.success && response.data) {
        toast.success('Order created successfully!')
        navigate(`/orders/${response.data.job_order.job_order_id}`)
      }
    } catch (error) {
      console.error('Failed to create order:', error)
    }
  }

  const isLoading = createOrderMutation.isLoading || getEstimateMutation.isLoading

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
        <p className="mt-1 text-sm text-gray-500">
          Fill in the details below to create your printing order
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Order Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    className={`input ${errors.title ? 'border-red-500' : ''}`}
                    placeholder="e.g., Business Cards for Marketing Team"
                    {...register('title', {
                      required: 'Order title is required',
                      minLength: {
                        value: 3,
                        message: 'Title must be at least 3 characters'
                      }
                    })}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    className={`input resize-none ${errors.description ? 'border-red-500' : ''}`}
                    placeholder="Provide detailed description of your printing requirements..."
                    {...register('description', {
                      required: 'Description is required',
                      minLength: {
                        value: 10,
                        message: 'Description must be at least 10 characters'
                      }
                    })}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      id="quantity"
                      min="1"
                      className={`input ${errors.quantity ? 'border-red-500' : ''}`}
                      placeholder="100"
                      {...register('quantity', {
                        required: 'Quantity is required',
                        min: {
                          value: 1,
                          message: 'Quantity must be at least 1'
                        },
                        valueAsNumber: true
                      })}
                    />
                    {errors.quantity && (
                      <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="due_date" className="block text-sm font-medium text-gray-700">
                      Due Date
                    </label>
                    <input
                      type="date"
                      id="due_date"
                      min={new Date().toISOString().split('T')[0]}
                      className="input"
                      {...register('due_date')}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Design Requirements */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Design Requirements</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="design_requirements" className="block text-sm font-medium text-gray-700">
                    Design Specifications
                  </label>
                  <textarea
                    id="design_requirements"
                    rows={3}
                    className="input resize-none"
                    placeholder="Size, colors, paper type, finishing options, etc."
                    {...register('design_requirements')}
                  />
                </div>

                <div>
                  <label htmlFor="special_instructions" className="block text-sm font-medium text-gray-700">
                    Special Instructions
                  </label>
                  <textarea
                    id="special_instructions"
                    rows={3}
                    className="input resize-none"
                    placeholder="Any special handling, packaging, or delivery instructions..."
                    {...register('special_instructions')}
                  />
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Design Files</h2>
              
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  {isDragActive
                    ? 'Drop the files here...'
                    : 'Drag & drop files here, or click to select files'
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Support: Images (JPG, PNG, GIF, SVG), Documents (PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX), Design Files (PSD, AI, EPS), Archives (ZIP, RAR), Text (TXT, CSV) - Max 50MB per file
                </p>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h3 className="text-sm font-medium text-gray-700">Uploaded Files:</h3>
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Cost Estimate */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Estimate</h3>
              
              <button
                type="button"
                onClick={handleGetEstimate}
                disabled={isLoading}
                className="w-full btn btn-outline btn-md mb-4"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Get Estimate
              </button>

              {estimate && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Estimated Cost:</span>
                    <span className="text-lg font-semibold text-green-600">
                      RM {estimate.estimated_cost}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Estimated Duration:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {estimate.estimated_duration}
                    </span>
                  </div>
                  
                  {estimate.breakdown && (
                    <div className="pt-3 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Breakdown:</h4>
                      <div className="space-y-1 text-xs text-gray-600">
                        {Object.entries(estimate.breakdown).map(([key, value]: [string, any]) => (
                          <div key={key} className="flex justify-between">
                            <span className="capitalize">{key.replace('_', ' ')}:</span>
                            <span>RM {value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Title:</span>
                  <span className="font-medium text-gray-900 truncate ml-2">
                    {watchedFields.title || 'Not specified'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium text-gray-900">
                    {watchedFields.quantity ? watchedFields.quantity.toLocaleString() : 'Not specified'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Due Date:</span>
                  <span className="font-medium text-gray-900">
                    {watchedFields.due_date 
                      ? new Date(watchedFields.due_date).toLocaleDateString() 
                      : 'Not specified'
                    }
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Files:</span>
                  <span className="font-medium text-gray-900">
                    {uploadedFiles.length} file(s)
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn btn-primary btn-md"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Order...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Order
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate('/orders')}
                className="w-full btn btn-outline btn-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default CreateOrderPage 