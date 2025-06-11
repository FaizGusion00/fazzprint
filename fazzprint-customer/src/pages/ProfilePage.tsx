import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit, 
  Save, 
  X, 
  Eye, 
  EyeOff,
  Shield,
  Package,
  Star,
  TrendingUp,
  Settings,
  Camera
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { apiService } from '@/services/api'
import { orderService } from '@/services/orderService'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'

interface UserProfile {
  user_id: number
  user_name: string
  full_name: string
  email: string
  phone_number: string
  address: string
  role: string
  created_at: string
  updated_at: string
  last_login_at?: string
  email_verified_at?: string
  profile_image?: string
  profile_image_url?: string
}

interface ProfileUpdateData {
  full_name: string
  email: string
  phone_number: string
  address: string
}

interface PasswordChangeData {
  current_password: string
  new_password: string
  password_confirmation: string
}

interface ProfileStats {
  total_orders: number
  completed_orders: number
  pending_orders: number
  total_spent: number
  average_order_value: number
  customer_since: string
  favorite_services: string[]
  recent_orders: any[]
}

const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth()
  const queryClient = useQueryClient()
  
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [profileData, setProfileData] = useState<ProfileUpdateData>({
    full_name: '',
    email: '',
    phone_number: '',
    address: ''
  })

  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    current_password: '',
    new_password: '',
    password_confirmation: ''
  })

  // Queries
  const { data: profileResponse, isLoading: profileLoading } = useQuery(
    ['user-profile', user?.user_id],
    () => apiService.get<{ user: UserProfile }>('/auth/profile'),
    {
      enabled: !!user,
      onSuccess: (response) => {
        const userData = response.data?.user
        if (userData) {
          setProfileData({
            full_name: userData.full_name,
            email: userData.email,
            phone_number: userData.phone_number,
            address: userData.address
          })
        }
      },
      onError: (error: any) => {
        toast.error('Failed to load profile information')
        console.error('Profile error:', error)
      }
    }
  )

  // Mutations
  const updateProfileMutation = useMutation(
    (data: ProfileUpdateData) => apiService.put('/auth/profile', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['user-profile'])
        queryClient.invalidateQueries(['auth-user'])
        setIsEditing(false)
        toast.success('Profile updated successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update profile')
      }
    }
  )

  const changePasswordMutation = useMutation(
    (data: PasswordChangeData) => apiService.post('/auth/change-password', data),
    {
      onSuccess: () => {
        setShowPasswordForm(false)
        setPasswordData({
          current_password: '',
          new_password: '',
          password_confirmation: ''
        })
        toast.success('Password changed successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to change password')
      }
    }
  )

  const uploadProfileImageMutation = useMutation(
    (file: File) => {
      const formData = new FormData()
      formData.append('profile_image', file)
      return apiService.post('/profile/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    {
      onSuccess: (response) => {
        queryClient.invalidateQueries(['user-profile'])
        refreshUser() // Refresh the auth context user data
        toast.success('Profile image updated successfully')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to update profile image')
      }
    }
  )

  // Query for dashboard stats
  const { data: statsResponse, isLoading: statsLoading } = useQuery(
    ['dashboard-stats', user?.user_id],
    () => apiService.get<{
      total_orders: number
      completed_orders: number
      pending_orders: number
      in_progress_orders: number
      recent_orders: any[]
    }>('/dashboard/stats'),
    {
      enabled: !!user,
      onError: (error: any) => {
        console.error('Stats error:', error)
        toast.error('Failed to load profile statistics')
      }
    }
  )

  const profileUser = profileResponse?.data?.user
  const statsData = statsResponse?.data
  
  // Build stats data from API response
  const stats: ProfileStats = {
    total_orders: statsData?.total_orders || 0,
    completed_orders: statsData?.completed_orders || 0,
    pending_orders: statsData?.pending_orders || 0,
    total_spent: 0, // We'll add this calculation later
    average_order_value: 0, // We'll add this calculation later
    customer_since: profileUser?.created_at || '',
    favorite_services: [],
    recent_orders: statsData?.recent_orders || []
  }

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfileMutation.mutate(profileData)
  }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.new_password !== passwordData.password_confirmation) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    changePasswordMutation.mutate(passwordData)
  }

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('File size must be less than 2MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }
      // Show preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      uploadProfileImageMutation.mutate(file, {
        onSuccess: () => setImagePreview(null)
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2
    }).format(amount)
  }

  if (profileLoading || statsLoading || !profileUser) {
    return <LoadingSpinner text="Loading profile..." />
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                {(() => {
                  console.log('ProfilePage - profileUser.profile_image_url:', profileUser?.profile_image_url);
                  console.log('ProfilePage - profileUser.profile_image:', profileUser?.profile_image);
                  console.log('ProfilePage - imagePreview:', imagePreview);
                  
                  if (imagePreview) {
                    return <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />;
                  } else if (profileUser?.profile_image_url) {
                    return (
                      <img
                        src={profileUser.profile_image_url}
                        alt={profileUser.full_name}
                        className="h-full w-full object-cover"
                        onError={() => console.log('ProfilePage image failed to load:', profileUser.profile_image_url)}
                      />
                    );
                  } else {
                    return <User className="h-10 w-10 text-primary-600" />;
                  }
                })()}
              </div>
              <label className="absolute bottom-0 right-0 h-6 w-6 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
                <Camera className="h-3 w-3 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profileUser.full_name}</h1>
              <p className="text-sm text-gray-500">@{profileUser.user_name}</p>
              <div className="flex items-center mt-1">
                <Shield className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 capitalize">{profileUser.role}</span>
                {profileUser.email_verified_at && (
                  <>
                    <span className="mx-2 text-gray-300">•</span>
                    <span className="text-sm text-green-600">Verified</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-primary btn-md"
            >
              {isEditing ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
                {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Package className="h-6 w-6 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <p className="text-lg font-bold text-gray-900">{stats.total_orders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Star className="h-6 w-6 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-lg font-bold text-gray-900">{stats.completed_orders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Spent</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(stats.total_spent)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Customer Since</p>
                <p className="text-sm font-bold text-gray-900">{formatDate(stats.customer_since)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
          
          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={profileData.phone_number}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone_number: e.target.value }))}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={profileData.address}
                  onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                  className="input"
                  rows={3}
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={updateProfileMutation.isLoading}
                  className="btn btn-primary btn-md"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn btn-outline btn-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="text-base text-gray-900">{profileUser.full_name}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-base text-gray-900">{profileUser.email}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Phone className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="text-base text-gray-900">{profileUser.phone_number}</p>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-base text-gray-900">{profileUser.address}</p>
                </div>
              </div>
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="text-base text-gray-900">{formatDate(profileUser.created_at)}</p>
                </div>
              </div>
              {profileUser.last_login_at && (
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Last Login</p>
                    <p className="text-base text-gray-900">{formatDate(profileUser.last_login_at)}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h2>
          
          {!showPasswordForm ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Password</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Keep your account secure with a strong password
                </p>
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="btn btn-outline btn-md"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Change Password
                </button>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Account Settings</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Manage your account preferences and privacy settings
                </p>
                <button className="btn btn-outline btn-md">
                  <Settings className="h-4 w-4 mr-2" />
                  Account Settings
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                    className="input pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                    className="input pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.password_confirmation}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, password_confirmation: e.target.value }))}
                    className="input pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={changePasswordMutation.isLoading}
                  className="btn btn-primary btn-md"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {changePasswordMutation.isLoading ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(false)}
                  className="btn btn-outline btn-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Recent Activity & Preferences */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h2>
            {stats.recent_orders && stats.recent_orders.length > 0 ? (
              <div className="space-y-3">
                {stats.recent_orders.slice(0, 5).map((order) => (
                  <div key={order.job_order_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{order.title}</p>
                      <p className="text-xs text-gray-500">#{order.job_order_url}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(order.total_price)}</p>
                      <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No recent orders found</p>
            )}
          </div>

          
        </div>
      )}
    </div>
  )
}

export default ProfilePage 