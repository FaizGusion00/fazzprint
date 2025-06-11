import React, { createContext, useContext, useState, ReactNode } from 'react'
import Toast from '../components/Toast'

interface ToastData {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
  duration?: number
}

interface ToastContextType {
  showToast: (toast: Omit<ToastData, 'id'>) => void
  showSuccess: (title: string, message: string, duration?: number) => void
  showError: (title: string, message: string, duration?: number) => void
  showInfo: (title: string, message: string, duration?: number) => void
  showWarning: (title: string, message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: ReactNode
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const showToast = (toastData: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { ...toastData, id }
    
    setToasts(prev => [...prev, newToast])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const showSuccess = (title: string, message: string, duration = 5000) => {
    showToast({ type: 'success', title, message, duration })
  }

  const showError = (title: string, message: string, duration = 5000) => {
    showToast({ type: 'error', title, message, duration })
  }

  const showInfo = (title: string, message: string, duration = 5000) => {
    showToast({ type: 'info', title, message, duration })
  }

  const showWarning = (title: string, message: string, duration = 5000) => {
    showToast({ type: 'warning', title, message, duration })
  }

  return (
    <ToastContext.Provider value={{
      showToast,
      showSuccess,
      showError,
      showInfo,
      showWarning
    }}>
      {children}
      
      {/* Render all toasts */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
          show={true}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  )
} 