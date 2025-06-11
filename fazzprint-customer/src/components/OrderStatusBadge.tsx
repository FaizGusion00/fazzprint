import React from 'react'
import { 
  FileText,
  AlertCircle,
  Loader, 
  CheckCircle, 
  XCircle,
  DollarSign
} from 'lucide-react'

interface OrderStatusBadgeProps {
  status: 'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled'
  className?: string
  showIcon?: boolean
  showDescription?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ 
  status, 
  className = '', 
  showIcon = true,
  showDescription = false,
  size = 'md'
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'draft':
        return {
          label: 'Draft',
          description: 'Order created, waiting for sales manager review',
          icon: <FileText className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`} />,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300',
          dotColor: 'bg-gray-400'
        }
      case 'pending':
        return {
          label: 'Pending Payment',
          description: 'Price confirmed, payment required to proceed',
          icon: <DollarSign className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`} />,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-300',
          dotColor: 'bg-yellow-500'
        }
      case 'in_progress':
        return {
          label: 'In Progress',
          description: 'Job confirmed and currently being processed',
          icon: <Loader className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} animate-spin`} />,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-300',
          dotColor: 'bg-blue-500'
        }
      case 'completed':
        return {
          label: 'Completed',
          description: 'Your order has been completed successfully',
          icon: <CheckCircle className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`} />,
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-300',
          dotColor: 'bg-green-500'
        }
      case 'cancelled':
        return {
          label: 'Cancelled',
          description: 'This order has been cancelled',
          icon: <XCircle className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`} />,
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-300',
          dotColor: 'bg-red-500'
        }
      default:
        return {
          label: 'Unknown',
          description: 'Status unknown',
          icon: <AlertCircle className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`} />,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-300',
          dotColor: 'bg-gray-400'
        }
    }
  }

  const config = getStatusConfig()
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  if (showDescription) {
    return (
      <div className={`inline-flex flex-col ${className}`}>
        <div className={`inline-flex items-center rounded-lg border ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size]} font-medium`}>
          {showIcon && (
            <span className="mr-2">
              {config.icon}
            </span>
          )}
          <span>{config.label}</span>
          <span className={`ml-2 h-2 w-2 rounded-full ${config.dotColor}`}></span>
        </div>
        {showDescription && (
          <p className={`mt-1 text-xs text-gray-600 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
            {config.description}
          </p>
        )}
      </div>
    )
  }

  return (
    <span className={`inline-flex items-center rounded-lg border ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size]} font-medium ${className}`}>
      {showIcon && (
        <span className="mr-2">
          {config.icon}
        </span>
      )}
      <span>{config.label}</span>
      <span className={`ml-2 h-2 w-2 rounded-full ${config.dotColor}`}></span>
    </span>
  )
}

export default OrderStatusBadge 