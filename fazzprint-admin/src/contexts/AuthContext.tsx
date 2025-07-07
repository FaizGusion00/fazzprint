import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, LoginData, AuthResponse, UserRole, RolePermissions } from '@/types'
import { adminApiService } from '@/services/api'
import toast from 'react-hot-toast'

interface SessionData {
  token: string
  user: User
  expires_at: number // timestamp
  created_at: number // timestamp
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  role: UserRole | null
  permissions: RolePermissions
  login: (data: LoginData) => Promise<boolean>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<boolean>
  refreshUser: () => Promise<void>
  hasPermission: (permission: keyof RolePermissions) => boolean
  isRole: (role: UserRole) => boolean
  checkRoleAccess: (allowedRoles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Session management constants
const SESSION_DURATION = 8 * 60 * 60 * 1000 // 8 hours for admin sessions (more secure)
const SESSION_REFRESH_THRESHOLD = 1 * 60 * 60 * 1000 // Refresh if less than 1 hour remaining
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000 // Check session every 5 minutes
const SESSION_STORAGE_KEY = 'fazzprint_admin_session'

// Role-based permissions configuration
const getRolePermissions = (role: UserRole): RolePermissions => {
  switch (role) {
    case 'admin':
      return {
        canViewAllOrders: true,
        canEditOrders: true,
        canDeleteOrders: true,
        canGenerateQR: true,
        canManageProcesses: true,
        canViewAnalytics: true,
        canManageUsers: true,
        canAccessSystemSettings: true,
      }
    case 'sales_manager':
      return {
        canViewAllOrders: true,
        canEditOrders: true,
        canDeleteOrders: false,
        canGenerateQR: true,
        canManageProcesses: false,
        canViewAnalytics: true,
        canManageUsers: false,
        canAccessSystemSettings: false,
      }
    case 'staff':
      return {
        canViewAllOrders: false,
        canEditOrders: false,
        canDeleteOrders: false,
        canGenerateQR: false,
        canManageProcesses: true,
        canViewAnalytics: false,
        canManageUsers: false,
        canAccessSystemSettings: false,
      }
    default:
      return {
        canViewAllOrders: false,
        canEditOrders: false,
        canDeleteOrders: false,
        canGenerateQR: false,
        canManageProcesses: false,
        canViewAnalytics: false,
        canManageUsers: false,
        canAccessSystemSettings: false,
      }
  }
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user
  const role = user?.role || null
  const permissions = role ? getRolePermissions(role) : getRolePermissions('customer')

  // Helper function to save session data
  const saveSessionData = (token: string, userData: User): void => {
    const now = Date.now()
    const sessionData: SessionData = {
      token,
      user: userData,
      expires_at: now + SESSION_DURATION,
      created_at: now
    }
    
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData))
    localStorage.setItem('fazzprint_admin_token', token)
    localStorage.setItem('fazzprint_admin_user', JSON.stringify(userData))
    
    console.log('Admin session saved:', {
      role: userData.role,
      expires_in_hours: Math.round((sessionData.expires_at - now) / (1000 * 60 * 60)),
      user: userData.full_name
    })
  }

  // Helper function to get session data
  const getSessionData = (): SessionData | null => {
    try {
      const sessionStr = localStorage.getItem(SESSION_STORAGE_KEY)
      if (!sessionStr) return null
      
      const sessionData: SessionData = JSON.parse(sessionStr)
      return sessionData
    } catch (error) {
      console.error('Error parsing admin session data:', error)
      return null
    }
  }

  // Helper function to check if session is valid
  const isSessionValid = (sessionData: SessionData): boolean => {
    const now = Date.now()
    const isExpired = now >= sessionData.expires_at
    
    if (isExpired) {
      console.log('Admin session expired:', {
        expired_hours_ago: Math.round((now - sessionData.expires_at) / (1000 * 60 * 60))
      })
    }
    
    return !isExpired
  }

  // Helper function to clear session data
  const clearSessionData = (): void => {
    localStorage.removeItem(SESSION_STORAGE_KEY)
    localStorage.removeItem('fazzprint_admin_token')
    localStorage.removeItem('fazzprint_admin_user')
    setUser(null)
    console.log('Admin session cleared')
  }

  // Auto-refresh session if needed
  const refreshSessionIfNeeded = async (): Promise<void> => {
    const sessionData = getSessionData()
    
    if (!sessionData) return

    if (!isSessionValid(sessionData)) {
      console.log('Admin session expired, logging out')
      clearSessionData()
      toast('Your session has expired. Please log in again.', { icon: '⚠️' })
      return
    }

    const now = Date.now()
    const timeRemaining = sessionData.expires_at - now
    
    if (timeRemaining <= SESSION_REFRESH_THRESHOLD) {
      try {
        console.log('Refreshing admin session automatically...')
        await refreshUser()
      } catch (error: any) {
        console.error('Failed to refresh admin session:', error)
        clearSessionData()
        toast.error('Session refresh failed. Please log in again.')
      }
    }
  }

  // Initialize user from session on app start
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('Initializing admin authentication...')
      const sessionData = getSessionData()

      if (sessionData) {
        if (isSessionValid(sessionData)) {
          console.log('Valid admin session found, restoring user')
          setUser(sessionData.user)
          
          // Verify role permissions (no admin role for now)
          const allowedRoles: UserRole[] = ['sales_manager', 'staff']
          if (!allowedRoles.includes(sessionData.user.role)) {
            console.error('Invalid role for admin portal:', sessionData.user.role)
            clearSessionData()
            toast.error('Access denied. Only Sales Managers and Staff can access this portal.')
          } else {
            // Refresh user data from server
            try {
              await refreshUser()
            } catch (error: any) {
              console.error('Failed to refresh user data on init:', error)
              // Continue with cached user data if refresh fails
            }
          }
        } else {
          console.log('Admin session expired, clearing data')
          clearSessionData()
          toast('Your session has expired. Please log in again.', { icon: 'ℹ️' })
        }
      } else {
        console.log('No admin session found')
      }
      
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  // Set up periodic session check
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(() => {
      refreshSessionIfNeeded()
    }, SESSION_CHECK_INTERVAL)

    return () => clearInterval(interval)
  }, [isAuthenticated])

  // Permission checking functions
  const hasPermission = (permission: keyof RolePermissions): boolean => {
    return permissions[permission]
  }

  const isRole = (checkRole: UserRole): boolean => {
    return role === checkRole
  }

  const checkRoleAccess = (allowedRoles: UserRole[]): boolean => {
    return role ? allowedRoles.includes(role) : false
  }

  const login = async (data: LoginData): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await adminApiService.auth.login(data)
      
      if (response.success && response.data) {
        const { user: userData, access_token } = response.data as AuthResponse
        
        // Validate role permissions for admin portal (no admin role for now)
        const allowedRoles: UserRole[] = ['sales_manager', 'staff']
        if (!allowedRoles.includes(userData.role)) {
          toast.error('Access denied. Only Sales Managers and Staff can access this portal.')
          return false
        }
        
        // Save session
        saveSessionData(access_token, userData)
        setUser(userData)
        
        // Success message based on role
        const roleMessages = {
          sales_manager: 'Welcome back, Sales Manager!',
          staff: 'Welcome back, Staff Member!'
        }
        
        toast.success(roleMessages[userData.role as keyof typeof roleMessages] || 'Login successful!')
        
        return true
      } else {
        toast.error(response.message || 'Login failed')
        return false
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      // Call logout API to invalidate token on server
      await adminApiService.auth.logout()
    } catch (error: any) {
      // Ignore errors, just clean up locally
      console.error('Admin logout API call failed:', error)
    }
    
    // Clear session data
    clearSessionData()
    
    toast.success('Logged out successfully')
    
    // Redirect to login page
    window.location.href = '/login'
  }

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await adminApiService.auth.updateProfile(data)
      
      if (response.success && response.data) {
        const updatedUser = (response.data as any).user
        
        // Update session with new user data
        const sessionData = getSessionData()
        if (sessionData) {
          saveSessionData(sessionData.token, updatedUser)
        }
        setUser(updatedUser)
        
        toast.success('Profile updated successfully!')
        return true
      } else {
        toast.error(response.message || 'Update failed')
        return false
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Update failed'
      toast.error(message)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUser = async (): Promise<void> => {
    try {
      console.log('Fetching fresh admin user data from /auth/profile...')
      const response = await adminApiService.auth.profile()
      
      if (response.success && response.data) {
        const userData = (response.data as any).user
        console.log('Fresh admin user data received:', userData.full_name, userData.role)
        
        // Validate role permissions (no admin role for now)
        const allowedRoles: UserRole[] = ['sales_manager', 'staff']
        if (!allowedRoles.includes(userData.role)) {
          console.error('Invalid role detected during refresh:', userData.role)
          clearSessionData()
          toast.error('Access denied. Only Sales Managers and Staff can access this portal.')
          return
        }
        
        // Update session with fresh user data and extend expiration
        const sessionData = getSessionData()
        if (sessionData) {
          saveSessionData(sessionData.token, userData)
        }
        setUser(userData)
      } else {
        console.error('Failed to get admin user profile:', response)
        throw new Error('Failed to refresh user data')
      }
    } catch (error: any) {
      console.error('Error refreshing admin user data:', error)
      // If refresh fails due to invalid token, clear session
      if (error.response?.status === 401) {
        clearSessionData()
      }
      throw error
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    role,
    permissions,
    login,
    logout,
    updateProfile,
    refreshUser,
    hasPermission,
    isRole,
    checkRoleAccess,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 