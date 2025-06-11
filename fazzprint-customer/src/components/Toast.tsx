import React, { useEffect, useState } from 'react'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'

interface ToastProps {
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
  duration?: number
  onClose: () => void
  show: boolean
}

const Toast: React.FC<ToastProps> = ({ 
  type, 
  title, 
  message, 
  duration = 5000, 
  onClose, 
  show 
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (show) {
      setShouldRender(true)
      // Small delay to ensure the element is in DOM before animation
      const timer = setTimeout(() => setIsVisible(true), 10)
      
      // Auto close after duration
      const closeTimer = setTimeout(() => {
        handleClose()
      }, duration)

      return () => {
        clearTimeout(timer)
        clearTimeout(closeTimer)
      }
    } else {
      handleClose()
    }
  }, [show, duration])

  const handleClose = () => {
    setIsVisible(false)
    // Wait for animation to complete before removing from DOM
    setTimeout(() => {
      setShouldRender(false)
      onClose()
    }, 300)
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'error':
        return <XCircle className="h-6 w-6 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />
      case 'info':
        return <Info className="h-6 w-6 text-blue-500" />
      default:
        return <Info className="h-6 w-6 text-blue-500" />
    }
  }

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-white border-l-4 border-green-500 shadow-lg shadow-green-100'
      case 'error':
        return 'bg-white border-l-4 border-red-500 shadow-lg shadow-red-100'
      case 'warning':
        return 'bg-white border-l-4 border-yellow-500 shadow-lg shadow-yellow-100'
      case 'info':
        return 'bg-white border-l-4 border-blue-500 shadow-lg shadow-blue-100'
      default:
        return 'bg-white border-l-4 border-blue-500 shadow-lg shadow-blue-100'
    }
  }

  if (!shouldRender) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div 
        className={`
          mt-6 mx-4 max-w-md w-full rounded-lg p-4 pointer-events-auto transform transition-all duration-300 ease-out
          ${getBgColor()}
          ${isVisible 
            ? 'translate-y-0 opacity-100 scale-100' 
            : '-translate-y-4 opacity-0 scale-95'
          }
        `}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-semibold text-gray-900">
              {title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {message}
            </p>
          </div>
          <div className="flex-shrink-0 ml-4">
            <button
              onClick={handleClose}
              className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all ease-linear ${
              type === 'success' ? 'bg-green-500' :
              type === 'error' ? 'bg-red-500' :
              type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{
              width: '100%',
              animation: `toast-progress ${duration}ms linear forwards`
            }}
          />
        </div>
      </div>
      
      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  )
}

export default Toast 