import React, { useState, useEffect } from 'react'
import { Clock, Shield, Activity, Info } from 'lucide-react'

interface SessionData {
  token: string
  user: any
  expires_at: number
  created_at: number
}

interface SessionStatusProps {
  className?: string
  showDetails?: boolean
}

const SessionStatus: React.FC<SessionStatusProps> = ({ 
  className = '', 
  showDetails = false 
}) => {
  const [sessionInfo, setSessionInfo] = useState<{
    isActive: boolean
    timeRemaining: string
    createdAt: string
    expiresAt: string
    daysRemaining: number
  } | null>(null)

  const getSessionData = (): SessionData | null => {
    try {
      const sessionStr = localStorage.getItem('fazzprint_session')
      if (sessionStr) {
        return JSON.parse(sessionStr)
      }
      
      // Fallback to old storage
      const token = localStorage.getItem('auth_token')
      const userStr = localStorage.getItem('user')
      if (token && userStr) {
        return {
          token,
          user: JSON.parse(userStr),
          expires_at: Date.now() + (2 * 24 * 60 * 60 * 1000),
          created_at: Date.now() - (24 * 60 * 60 * 1000)
        }
      }
      
      return null
    } catch {
      return null
    }
  }

  const formatTimeRemaining = (milliseconds: number): string => {
    if (milliseconds <= 0) return 'Expired'
    
    const days = Math.floor(milliseconds / (24 * 60 * 60 * 1000))
    const hours = Math.floor((milliseconds % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000))

    if (days > 0) {
      return `${days}d ${hours}h`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  const updateSessionInfo = () => {
    const sessionData = getSessionData()
    if (!sessionData) {
      setSessionInfo(null)
      return
    }

    const now = Date.now()
    const timeRemaining = sessionData.expires_at - now
    const isActive = timeRemaining > 0
    const daysRemaining = Math.ceil(timeRemaining / (24 * 60 * 60 * 1000))

    setSessionInfo({
      isActive,
      timeRemaining: formatTimeRemaining(timeRemaining),
      createdAt: new Date(sessionData.created_at).toLocaleDateString(),
      expiresAt: new Date(sessionData.expires_at).toLocaleDateString(),
      daysRemaining: Math.max(0, daysRemaining)
    })
  }

  useEffect(() => {
    updateSessionInfo()
    
    // Update every minute
    const interval = setInterval(updateSessionInfo, 60000)
    
    return () => clearInterval(interval)
  }, [])

  if (!sessionInfo || !sessionInfo.isActive) {
    return null
  }

  const getStatusColor = () => {
    if (sessionInfo.daysRemaining >= 2) return 'text-green-600 bg-green-50 border-green-200'
    if (sessionInfo.daysRemaining >= 1) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getStatusIcon = () => {
    if (sessionInfo.daysRemaining >= 2) return <Shield className="h-4 w-4" />
    if (sessionInfo.daysRemaining >= 1) return <Clock className="h-4 w-4" />
    return <Activity className="h-4 w-4" />
  }

  if (!showDetails) {
    // Compact version for header/navbar
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-md border text-xs font-medium ${getStatusColor()} ${className}`}>
        {getStatusIcon()}
        <span className="ml-1">{sessionInfo.timeRemaining}</span>
      </div>
    )
  }

  // Detailed version for settings/profile page
  return (
    <div className={`p-4 rounded-lg border ${getStatusColor()} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          {getStatusIcon()}
          <div className="ml-3">
            <h3 className="text-sm font-medium">Session Status</h3>
            <p className="text-sm opacity-90">
              {sessionInfo.daysRemaining >= 2 ? 'Active and secure' : 
               sessionInfo.daysRemaining >= 1 ? 'Expires soon' : 
               'Expires very soon'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">{sessionInfo.timeRemaining}</p>
          <p className="text-xs opacity-75">remaining</p>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
        <div>
          <p className="opacity-75">Session started</p>
          <p className="font-medium">{sessionInfo.createdAt}</p>
        </div>
        <div>
          <p className="opacity-75">Expires on</p>
          <p className="font-medium">{sessionInfo.expiresAt}</p>
        </div>
      </div>
      
      <div className="mt-3 flex items-center text-xs opacity-75">
        <Info className="h-3 w-3 mr-1" />
        <span>Sessions automatically extend with activity and last up to 2 days</span>
      </div>
    </div>
  )
}

export default SessionStatus 