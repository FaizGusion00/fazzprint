import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, LoginData, RegisterData, AuthResponse } from '@/types'
import { apiService } from '@/services/api'
import toast from 'react-hot-toast'

interface SessionData {
  token: string
  user: User
  expires_at: number // timestamp
  created_at: number // timestamp
}

interface RememberMeData {
  login: string
  encrypted_password: string
  saved_at: number
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginData) => Promise<boolean>
  register: (data: RegisterData) => Promise<boolean>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<boolean>
  refreshUser: () => Promise<void>
  extendSession: () => void
  getSavedCredentials: () => { login: string; password: string } | null
  clearSavedCredentials: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Session management constants
const SESSION_DURATION = 2 * 24 * 60 * 60 * 1000 // 2 days in milliseconds
const SESSION_REFRESH_THRESHOLD = 4 * 60 * 60 * 1000 // Refresh if less than 4 hours remaining
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000 // Check session every 5 minutes
const SESSION_STORAGE_KEY = 'fazzprint_session'
const REMEMBER_ME_STORAGE_KEY = 'fazzprint_remember_credentials'

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  // Simple encryption/decryption functions (for demo purposes)
  const simpleEncrypt = (text: string): string => {
    return btoa(text.split('').reverse().join(''))
  }

  const simpleDecrypt = (encrypted: string): string => {
    try {
      return atob(encrypted).split('').reverse().join('')
    } catch {
      return ''
    }
  }

  // Helper function to save credentials
  const saveCredentials = (login: string, password: string): void => {
    const rememberData: RememberMeData = {
      login,
      encrypted_password: simpleEncrypt(password),
      saved_at: Date.now()
    }
    localStorage.setItem(REMEMBER_ME_STORAGE_KEY, JSON.stringify(rememberData))
    console.log('Credentials saved for remember me')
  }

  // Helper function to get saved credentials
  const getSavedCredentials = (): { login: string; password: string } | null => {
    try {
      const savedData = localStorage.getItem(REMEMBER_ME_STORAGE_KEY)
      if (!savedData) return null

      const rememberData: RememberMeData = JSON.parse(savedData)
      
      // Check if credentials are not too old (30 days max)
      const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days
      if (Date.now() - rememberData.saved_at > maxAge) {
        clearSavedCredentials()
        return null
      }

      return {
        login: rememberData.login,
        password: simpleDecrypt(rememberData.encrypted_password)
      }
    } catch (error) {
      console.error('Error retrieving saved credentials:', error)
      clearSavedCredentials()
      return null
    }
  }

  // Helper function to clear saved credentials
  const clearSavedCredentials = (): void => {
    localStorage.removeItem(REMEMBER_ME_STORAGE_KEY)
    console.log('Saved credentials cleared')
  }

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
    localStorage.setItem('auth_token', token) // Keep for backward compatibility
    localStorage.setItem('user', JSON.stringify(userData)) // Keep for backward compatibility
    
    console.log('Session saved:', {
      expires_in_hours: Math.round((sessionData.expires_at - now) / (1000 * 60 * 60)),
      user: userData.full_name
    })
  }

  // Helper function to get session data
  const getSessionData = (): SessionData | null => {
    try {
      const sessionStr = localStorage.getItem(SESSION_STORAGE_KEY)
      if (!sessionStr) {
        // Fallback to old storage format
        const token = localStorage.getItem('auth_token')
        const userStr = localStorage.getItem('user')
        
        if (token && userStr) {
          const userData = JSON.parse(userStr)
          // Convert old format to new format with 2-day expiration
          const now = Date.now()
          return {
            token,
            user: userData,
            expires_at: now + SESSION_DURATION,
            created_at: now - (24 * 60 * 60 * 1000) // Assume it was created yesterday
          }
        }
        return null
      }
      
      const sessionData: SessionData = JSON.parse(sessionStr)
      return sessionData
    } catch (error) {
      console.error('Error parsing session data:', error)
      return null
    }
  }

  // Helper function to check if session is valid
  const isSessionValid = (sessionData: SessionData): boolean => {
    const now = Date.now()
    const isExpired = now >= sessionData.expires_at
    
    if (isExpired) {
      console.log('Session expired:', {
        expired_hours_ago: Math.round((now - sessionData.expires_at) / (1000 * 60 * 60))
      })
    }
    
    return !isExpired
  }

  // Helper function to check if session needs refresh
  const shouldRefreshSession = (sessionData: SessionData): boolean => {
    const now = Date.now()
    const timeRemaining = sessionData.expires_at - now
    return timeRemaining <= SESSION_REFRESH_THRESHOLD && timeRemaining > 0
  }

  // Helper function to clear session data
  const clearSessionData = (): void => {
    localStorage.removeItem(SESSION_STORAGE_KEY)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    setUser(null)
    console.log('Session cleared')
  }

  // Extend session (called on user activity)
  const extendSession = (): void => {
    const sessionData = getSessionData()
    if (sessionData && isSessionValid(sessionData)) {
      const now = Date.now()
      const timeRemaining = sessionData.expires_at - now
      
      // Only extend if more than half the session time has passed
      if (timeRemaining < SESSION_DURATION / 2) {
        saveSessionData(sessionData.token, sessionData.user)
        console.log('Session extended')
      }
    }
  }

  // Auto-refresh session if needed
  const refreshSessionIfNeeded = async (): Promise<void> => {
    const sessionData = getSessionData()
    
    if (!sessionData) return

    if (!isSessionValid(sessionData)) {
      console.log('Session expired, logging out')
      clearSessionData()
      toast('Your session has expired. Please log in again.', { icon: '⚠️' })
      return
    }

    if (shouldRefreshSession(sessionData)) {
      try {
        console.log('Refreshing session automatically...')
        await refreshUser()
        // Session will be extended in refreshUser if successful
      } catch (error: any) {
        console.error('Failed to refresh session:', error)
        clearSessionData()
        toast.error('Session refresh failed. Please log in again.')
      }
    }
  }

  // Initialize user from session on app start
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('Initializing authentication...')
      const sessionData = getSessionData()

      if (sessionData) {
        if (isSessionValid(sessionData)) {
          console.log('Valid session found, restoring user')
          // Set user from session first for immediate UI update
          setUser(sessionData.user)
          
          // Then refresh from server to get latest data
          try {
            await refreshUser()
          } catch (error: any) {
            console.error('Failed to refresh user data on init:', error)
            // Continue with cached user data
          }
        } else {
          console.log('Session expired, clearing data')
          clearSessionData()
          toast('Your session has expired. Please log in again.', { icon: 'ℹ️' })
        }
      } else {
        console.log('No session found')
      }
      
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  // Set up periodic session check
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated) {
        refreshSessionIfNeeded()
      }
    }, SESSION_CHECK_INTERVAL)

    return () => clearInterval(interval)
  }, [isAuthenticated])

  // Set up user activity listeners to extend session
  useEffect(() => {
    const handleUserActivity = () => {
      if (isAuthenticated) {
        extendSession()
      }
    }

    // Listen for user activity events
    const events = ['click', 'keypress', 'scroll', 'mousemove']
    let activityTimeout: NodeJS.Timeout

    const throttledActivity = () => {
      clearTimeout(activityTimeout)
      activityTimeout = setTimeout(handleUserActivity, 1000) // Throttle to once per second
    }

    events.forEach(event => {
      document.addEventListener(event, throttledActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledActivity)
      })
      clearTimeout(activityTimeout)
    }
  }, [isAuthenticated])

  const login = async (data: LoginData): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await apiService.post<AuthResponse>('/auth/login', data)
      
      if (response.success && response.data) {
        const { user: userData, access_token } = response.data
        
        // Save session with 2-day expiration
        saveSessionData(access_token, userData)
        setUser(userData)
        
        // Handle remember me functionality
        if (data.remember_me) {
          saveCredentials(data.login, data.password)
          toast.success('Login successful! Credentials saved for next time.')
        } else {
          clearSavedCredentials()
          toast.success('Login successful! Session will remain active for 2 days.')
        }
        
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

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await apiService.post<AuthResponse>('/auth/register', data)
      
      if (response.success && response.data) {
        const { user: userData, access_token } = response.data
        
        // Save session with 2-day expiration
        saveSessionData(access_token, userData)
        setUser(userData)
        
        toast.success('Registration successful! Welcome to FazzPrint!')
        return true
      } else {
        toast.error(response.message || 'Registration failed')
        return false
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed'
      if (error.response?.data?.errors) {
        // Handle validation errors
        const errors = error.response.data.errors
        Object.keys(errors).forEach(key => {
          errors[key].forEach((errorMsg: string) => {
            toast.error(errorMsg)
          })
        })
      } else {
        toast.error(message)
      }
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      // Call logout API to invalidate token on server
      await apiService.post('/auth/logout')
    } catch (error: any) {
      // Ignore errors, just clean up locally
      console.error('Logout API call failed:', error)
    }
    
    // Clear session data but keep saved credentials if they exist
    clearSessionData()
    
    // Don't clear saved credentials on logout - only clear them if user unchecks remember me
    toast.success('Logged out successfully')
    
    // Redirect to home page
    window.location.href = '/'
  }

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      setIsLoading(true)
      const response = await apiService.put<{ user: User }>('/auth/profile', data)
      
      if (response.success && response.data) {
        const updatedUser = response.data.user
        
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
      console.log('Fetching fresh user data from /auth/profile...')
      const response = await apiService.get<{ user: User }>('/auth/profile')
      
      if (response.success && response.data) {
        const userData = response.data.user
        console.log('Fresh user data received:', userData.full_name)
        
        // Update session with fresh user data and extend expiration
        const sessionData = getSessionData()
        if (sessionData) {
          saveSessionData(sessionData.token, userData)
        }
        setUser(userData)
      } else {
        console.error('Failed to get user profile:', response)
        throw new Error('Failed to refresh user data')
      }
    } catch (error: any) {
      console.error('Error refreshing user data:', error)
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
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
    extendSession,
    getSavedCredentials,
    clearSavedCredentials,
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