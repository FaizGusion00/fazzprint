import React, { useState, useEffect } from 'react'
import { 
  Download, 
  Eye, 
  X, 
  FileText, 
  Image, 
  File,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize,
  FileImage,
  FileType,
  FileArchive,
  FileVideo,
  FileAudio,
  Trash2
} from 'lucide-react'
import { useDownloadOrderFile, useDeleteOrderFile } from '@/hooks/useOrders'
import { useToast } from '@/contexts/ToastContext'

interface FileViewerProps {
  file: {
    file_id: number
    file_name: string
    file_path: string
    file_type: string
    file_size: number
    mime_type: string
    description?: string
    is_design_file?: boolean
    created_at: string
    file_url?: string
    download_url?: string
  }
  orderId: number
  canDelete?: boolean
  showDeleteButton?: boolean
  onClose?: () => void
  onDeleted?: () => void
}

const FileViewer: React.FC<FileViewerProps> = ({ 
  file, 
  orderId, 
  canDelete = false, 
  showDeleteButton = false,
  onClose,
  onDeleted 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [imageZoom, setImageZoom] = useState(100)
  const [imageRotation, setImageRotation] = useState(0)
  const [imageError, setImageError] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  const downloadMutation = useDownloadOrderFile()
  const deleteMutation = useDeleteOrderFile()

  // Reset image state when file changes
  useEffect(() => {
    setImageError(false)
    setImageZoom(100)
    setImageRotation(0)
  }, [file.file_id])

  // Helper function to get file URL with proper fallback
  const getFileUrl = (filePath: string) => {
    if (file.file_url) {
      return file.file_url
    }
    
    // Fallback to constructing URL
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
    return `${baseUrl}/storage/${filePath}`
  }

  // Enhanced file type detection
  const getFileType = (mimeType: string, fileExtension: string) => {
    const ext = fileExtension.toLowerCase()
    const mime = mimeType?.toLowerCase() || ''
    
    if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) {
      return 'image'
    }
    if (mime === 'application/pdf' || ext === 'pdf') {
      return 'pdf'
    }
    if (mime.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) {
      return 'video'
    }
    if (mime.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(ext)) {
      return 'audio'
    }
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return 'archive'
    }
    if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) {
      return 'document'
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return 'spreadsheet'
    }
    if (['ppt', 'pptx'].includes(ext)) {
      return 'presentation'
    }
    if (['psd', 'ai', 'eps', 'sketch', 'fig'].includes(ext)) {
      return 'design'
    }
    
    return 'other'
  }

  // Get appropriate icon for file type
  const getFileIcon = (fileType: string) => {
    const iconProps = { className: "h-5 w-5" }
    
    switch (fileType) {
      case 'image':
        return <FileImage {...iconProps} className="h-5 w-5 text-blue-500" />
      case 'pdf':
        return <FileText {...iconProps} className="h-5 w-5 text-red-500" />
      case 'video':
        return <FileVideo {...iconProps} className="h-5 w-5 text-purple-500" />
      case 'audio':
        return <FileAudio {...iconProps} className="h-5 w-5 text-green-500" />
      case 'archive':
        return <FileArchive {...iconProps} className="h-5 w-5 text-yellow-500" />
      case 'design':
        return <Image {...iconProps} className="h-5 w-5 text-pink-500" />
      case 'document':
      case 'spreadsheet':
      case 'presentation':
        return <FileType {...iconProps} className="h-5 w-5 text-blue-600" />
      default:
        return <File {...iconProps} className="h-5 w-5 text-gray-500" />
    }
  }

  // Check if file can be previewed in browser
  const canPreview = (fileType: string) => {
    return ['image', 'pdf'].includes(fileType)
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Handle download
  const handleDownload = async () => {
    try {
      await downloadMutation.mutateAsync({
        orderId,
        fileId: file.file_id,
        fileName: file.file_name
      })
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  // Handle delete
  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({
        orderId,
        fileId: file.file_id
      })
      setShowDeleteConfirm(false)
      onDeleted?.()
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  // Handle preview
  const handlePreview = () => {
    setIsModalOpen(true)
  }

  // Handle zoom controls
  const handleZoomIn = () => setImageZoom(prev => Math.min(prev + 25, 300))
  const handleZoomOut = () => setImageZoom(prev => Math.max(prev - 25, 25))
  const handleRotate = () => setImageRotation(prev => (prev + 90) % 360)
  const handleResetZoom = () => {
    setImageZoom(100)
    setImageRotation(0)
  }

  const fileType = getFileType(file.mime_type, file.file_type)
  const canPreviewFile = canPreview(fileType)

  return (
    <>
      {/* File Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="flex-shrink-0 p-2 bg-gray-50 rounded-lg">
              {getFileIcon(fileType)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 truncate" title={file.file_name}>
                {file.file_name}
              </h4>
              <p className="text-xs text-gray-500">
                {file.file_type?.toUpperCase()} • {formatFileSize(file.file_size)}
              </p>
              {file.description && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-2" title={file.description}>
                  {file.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
            {canPreviewFile && (
              <button
                onClick={handlePreview}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Preview file"
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={handleDownload}
              disabled={downloadMutation.isLoading}
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
              title="Download file"
            >
              <Download className="h-4 w-4" />
            </button>
            {showDeleteButton && canDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={deleteMutation.isLoading}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                title="Delete file"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Uploaded {new Date(file.created_at).toLocaleDateString()}</span>
          <div className="flex items-center space-x-2">
            {file.is_design_file && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Design File
              </span>
            )}
            {fileType === 'image' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Image
              </span>
            )}
          </div>
        </div>

        {/* Inline image preview for images */}
        {fileType === 'image' && !imageError && (
          <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
            <img
              src={getFileUrl(file.file_path)}
              alt={file.file_name}
              className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={handlePreview}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          </div>
        )}

        {/* Error state for failed image loads */}
        {fileType === 'image' && imageError && (
          <div className="mt-3 rounded-lg border-2 border-dashed border-gray-300 p-4 text-center">
            <FileImage className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Image preview unavailable</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete File</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete "{file.file_name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-7xl max-h-full w-full h-full flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 truncate">{file.file_name}</h3>
                <p className="text-sm text-gray-500">
                  {file.file_type?.toUpperCase()} • {formatFileSize(file.file_size)}
                </p>
              </div>
              
              {/* Controls */}
              <div className="flex items-center space-x-2 ml-4">
                {fileType === 'image' && (
                  <>
                    <button
                      onClick={handleZoomOut}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                      title="Zoom out"
                    >
                      <ZoomOut className="h-4 w-4" />
                    </button>
                    <span className="text-sm text-gray-500 min-w-[3rem] text-center">
                      {imageZoom}%
                    </span>
                    <button
                      onClick={handleZoomIn}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                      title="Zoom in"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleRotate}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                      title="Rotate"
                    >
                      <RotateCw className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleResetZoom}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                      title="Reset"
                    >
                      <Maximize className="h-4 w-4" />
                    </button>
                  </>
                )}
                
                <button
                  onClick={handleDownload}
                  disabled={downloadMutation.isLoading}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </button>
                
                <a
                  href={getFileUrl(file.file_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                
                <button
                  onClick={() => {
                    setIsModalOpen(false)
                    onClose?.()
                  }}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden bg-gray-50">
              {fileType === 'image' ? (
                <div className="h-full flex items-center justify-center p-4 overflow-auto">
                  {!imageError ? (
                    <img
                      src={getFileUrl(file.file_path)}
                      alt={file.file_name}
                      className="max-w-none transition-transform duration-200 shadow-lg"
                      style={{
                        transform: `scale(${imageZoom / 100}) rotate(${imageRotation}deg)`,
                        maxHeight: imageZoom <= 100 ? '100%' : 'none',
                        maxWidth: imageZoom <= 100 ? '100%' : 'none'
                      }}
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="text-center">
                      <FileImage className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Image failed to load</h3>
                      <p className="text-gray-500 mb-4">The image could not be displayed.</p>
                      <button
                        onClick={handleDownload}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download File
                      </button>
                    </div>
                  )}
                </div>
              ) : fileType === 'pdf' ? (
                <div className="h-full">
                  <iframe
                    src={getFileUrl(file.file_path)}
                    className="w-full h-full border-0"
                    title={file.file_name}
                  />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center max-w-md">
                    {getFileIcon(fileType)}
                    <h3 className="text-lg font-medium text-gray-900 mb-2 mt-4">Preview not available</h3>
                    <p className="text-gray-500 mb-6">
                      This file type cannot be previewed in the browser. Click download to view the file.
                    </p>
                    <button
                      onClick={handleDownload}
                      disabled={downloadMutation.isLoading}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      {downloadMutation.isLoading ? 'Downloading...' : 'Download File'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default FileViewer 