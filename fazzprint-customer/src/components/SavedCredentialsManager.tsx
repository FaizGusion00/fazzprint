import React, { useState, useEffect } from 'react'
import { Trash2, Shield, User, Key, Calendar } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

const SavedCredentialsManager: React.FC = () => {
  const { getSavedCredentials, clearSavedCredentials } = useAuth()
  const [savedCredentials, setSavedCredentials] = useState<{
    login: string
    password: string
    savedAt?: Date
  } | null>(null)

  // Check for saved credentials on component mount
  useEffect(() => {
    const credentials = getSavedCredentials()
    if (credentials) {
      // Get the saved date from localStorage
      try {
        const rememberData = localStorage.getItem('fazzprint_remember_credentials')
        if (rememberData) {
          const parsed = JSON.parse(rememberData)
          setSavedCredentials({
            ...credentials,
            savedAt: new Date(parsed.saved_at)
          })
        }
      } catch (error) {
        setSavedCredentials(credentials)
      }
    }
  }, [getSavedCredentials])

  const handleClearCredentials = () => {
    if (window.confirm('Are you sure you want to clear your saved login credentials? You will need to enter them manually next time.')) {
      clearSavedCredentials()
      setSavedCredentials(null)
      toast.success('Saved credentials cleared successfully')
    }
  }

  const maskPassword = (password: string): string => {
    return '•'.repeat(Math.min(password.length, 12))
  }

  const formatSavedDate = (date: Date): string => {
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const getExpiryDate = (savedDate: Date): Date => {
    const expiryDate = new Date(savedDate)
    expiryDate.setDate(expiryDate.getDate() + 30)
    return expiryDate
  }

  const getDaysUntilExpiry = (savedDate: Date): number => {
    const now = new Date()
    const expiryDate = getExpiryDate(savedDate)
    const diffTime = expiryDate.getTime() - now.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  if (!savedCredentials) {
    return (
      <div className="text-center py-6">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <h6 className="text-sm font-medium text-gray-900 mb-2">No Saved Credentials</h6>
        <p className="text-sm text-gray-500 mb-4">
          You don't have any saved login credentials. Check "Remember me" when logging in to save your credentials securely.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            <strong>Security Note:</strong> Credentials are encrypted and stored locally on your device only. 
            They expire automatically after 30 days and are never sent to our servers.
          </p>
        </div>
      </div>
    )
  }

  const daysUntilExpiry = savedCredentials.savedAt ? getDaysUntilExpiry(savedCredentials.savedAt) : 30
  const isExpiringSoon = daysUntilExpiry <= 7

  return (
    <div className="space-y-4">
      {/* Saved Credentials Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="flex-1">
              <h6 className="text-sm font-medium text-green-900">Credentials Saved</h6>
              <p className="text-sm text-green-700">
                Your login information is securely stored on this device
              </p>
            </div>
          </div>
          <button
            onClick={handleClearCredentials}
            className="flex-shrink-0 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
            title="Clear saved credentials"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Credential Details */}
      <div className="grid grid-cols-1 gap-3">
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <User className="h-4 w-4 text-gray-500" />
          <div className="flex-1">
            <p className="text-xs text-gray-500">Username/Email</p>
            <p className="text-sm font-medium text-gray-900">{savedCredentials.login}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <Key className="h-4 w-4 text-gray-500" />
          <div className="flex-1">
            <p className="text-xs text-gray-500">Password</p>
            <p className="text-sm font-medium text-gray-900 font-mono">
              {maskPassword(savedCredentials.password)}
            </p>
          </div>
        </div>

        {savedCredentials.savedAt && (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="h-4 w-4 text-gray-500" />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Saved</p>
              <p className="text-sm font-medium text-gray-900">
                {formatSavedDate(savedCredentials.savedAt)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Expiry Information */}
      <div className={`p-3 rounded-lg border ${
        isExpiringSoon 
          ? 'bg-yellow-50 border-yellow-200' 
          : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${
              isExpiringSoon ? 'text-yellow-800' : 'text-blue-800'
            }`}>
              {isExpiringSoon ? 'Expiring Soon' : 'Auto-Expiry'}
            </p>
            <p className={`text-xs ${
              isExpiringSoon ? 'text-yellow-700' : 'text-blue-700'
            }`}>
              {daysUntilExpiry > 0 
                ? `Expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`
                : 'Expired (will be cleared on next login)'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Clear Credentials Button */}
      <button
        onClick={handleClearCredentials}
        className="w-full flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-lg text-red-700 bg-white hover:bg-red-50 transition-colors"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Clear Saved Credentials
      </button>

      {/* Security Information */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <h6 className="text-xs font-medium text-gray-900 mb-2">Security Information</h6>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Credentials are encrypted and stored locally only</li>
          <li>• They are never transmitted to our servers</li>
          <li>• Automatically expire after 30 days</li>
          <li>• Cleared when you explicitly log out</li>
          <li>• Only accessible on this specific device and browser</li>
        </ul>
      </div>
    </div>
  )
}

export default SavedCredentialsManager 