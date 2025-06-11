import React from 'react'
import { 
  FileText, 
  DollarSign, 
  Loader, 
  CheckCircle,
  Clock
} from 'lucide-react'

interface OrderTimelineProps {
  currentStatus: 'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled'
  className?: string
  showDescriptions?: boolean
}

const OrderTimeline: React.FC<OrderTimelineProps> = ({ 
  currentStatus, 
  className = '',
  showDescriptions = true
}) => {
  const steps = [
    {
      id: 'draft',
      title: 'Order Created',
      description: 'You submitted your order details',
      icon: FileText,
      completed: ['pending', 'in_progress', 'completed'].includes(currentStatus),
      current: currentStatus === 'draft',
      action: 'Waiting for sales manager review'
    },
    {
      id: 'pending',
      title: 'Price Confirmed',
      description: 'Sales manager reviewed and set the price',
      icon: DollarSign,
      completed: ['in_progress', 'completed'].includes(currentStatus),
      current: currentStatus === 'pending',
      action: 'Payment required to continue'
    },
    {
      id: 'in_progress',
      title: 'Job in Progress',
      description: 'Your order is being processed',
      icon: Loader,
      completed: ['completed'].includes(currentStatus),
      current: currentStatus === 'in_progress',
      action: 'Work in progress'
    },
    {
      id: 'completed',
      title: 'Completed',
      description: 'Your order is ready',
      icon: CheckCircle,
      completed: currentStatus === 'completed',
      current: currentStatus === 'completed',
      action: 'Order completed successfully'
    }
  ]

  if (currentStatus === 'cancelled') {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
              <FileText className="h-5 w-5 text-red-600" />
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-red-900">Order Cancelled</h3>
            <p className="text-sm text-red-700">This order has been cancelled and will not be processed.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-6">Order Progress</h3>
      
      <div className="space-y-8">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isLast = index === steps.length - 1
          
          return (
            <div key={step.id} className="relative">
              {/* Connector line */}
              {!isLast && (
                <div className={`absolute left-5 top-10 w-0.5 h-8 ${
                  step.completed ? 'bg-green-400' : 'bg-gray-300'
                }`} />
              )}
              
              <div className="flex items-start">
                {/* Icon */}
                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                  step.completed 
                    ? 'bg-green-100 text-green-600' 
                    : step.current 
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-gray-100 text-gray-400'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : step.current ? (
                    <Icon className={`h-5 w-5 ${step.id === 'in_progress' ? 'animate-spin' : ''}`} />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                
                {/* Content */}
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-medium ${
                      step.completed 
                        ? 'text-green-900' 
                        : step.current 
                          ? 'text-yellow-900'
                          : 'text-gray-500'
                    }`}>
                      {step.title}
                    </h4>
                    
                    {step.current && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" />
                        Current
                      </span>
                    )}
                    
                    {step.completed && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Done
                      </span>
                    )}
                  </div>
                  
                  {showDescriptions && (
                    <div className="mt-1">
                      <p className={`text-sm ${
                        step.completed 
                          ? 'text-green-700' 
                          : step.current 
                            ? 'text-yellow-700'
                            : 'text-gray-500'
                      }`}>
                        {step.description}
                      </p>
                      
                      {step.current && (
                        <p className="text-xs text-yellow-600 mt-1 font-medium">
                          → {step.action}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      {/* Additional info based on current status */}
      {currentStatus === 'draft' && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-900">What happens next?</h4>
              <p className="text-sm text-blue-700 mt-1">
                Our sales manager will review your order and provide an accurate price quote. 
                You'll receive a notification once the review is complete.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {currentStatus === 'pending' && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <DollarSign className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-yellow-900">Payment Required</h4>
              <p className="text-sm text-yellow-700 mt-1">
                The price has been confirmed by our sales manager. Please contact them directly 
                to arrange payment and proceed with your order.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {currentStatus === 'in_progress' && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <Loader className="h-5 w-5 text-blue-600 mt-0.5 animate-spin" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-900">Work in Progress</h4>
              <p className="text-sm text-blue-700 mt-1">
                Great! Payment confirmed and your order is now being processed. 
                We'll keep you updated on the progress.
              </p>
            </div>
          </div>
        </div>
      )}
      
      {currentStatus === 'completed' && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-green-900">Order Completed!</h4>
              <p className="text-sm text-green-700 mt-1">
                Your order has been completed successfully. Please contact our sales manager 
                to arrange pickup or delivery.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrderTimeline 