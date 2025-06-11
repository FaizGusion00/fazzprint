import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  Home, 
  FileText, 
  Plus, 
  Search, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Printer,
  Check,

} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from 'react-query'
import { notificationService } from '@/services/notificationService'
import SessionStatus from '@/components/SessionStatus'

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

interface Notification {
  notification_id: number
  type: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = React.useState(false)
  const notificationRef = React.useRef<HTMLDivElement>(null)
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Fetch notifications for popup
  const { data: notificationsData, refetch } = useQuery({
    queryKey: ['notifications-popup'],
    queryFn: notificationService.getPopupNotifications,
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  const notifications = notificationsData?.data?.notifications || []
  const unreadCount = notificationsData?.data?.unread_count || 0

  // Handle click outside to close notification popup
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false)
      }
    }

    if (isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isNotificationOpen])

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    try {
      await notificationService.markAsRead(notificationId)
      refetch() // Refresh notifications after marking as read
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead()
      refetch() // Refresh notifications after marking all as read
      setIsNotificationOpen(false)
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Orders', href: '/orders', icon: FileText },
    { name: 'Create Order', href: '/orders/create', icon: Plus },
    { name: 'Track Order', href: '/track', icon: Search },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  const isActivePath = (path: string) => {
    return location.pathname === path || 
           (path !== '/dashboard' && location.pathname.startsWith(path))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_created':
      case 'order_update':
      case 'order_in_progress':
        return <FileText className="h-4 w-4 text-blue-600" />
      case 'payment_received':
        return <Check className="h-4 w-4 text-green-600" />
      default:
        return <Bell className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 sm:w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:transform-none lg:w-64 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 border-b border-gray-200">
            <Link to="/dashboard" className="flex items-center space-x-2" onClick={() => setIsSidebarOpen(false)}>
              <Printer className="h-6 w-6 text-primary-600" />
              <span className="text-lg font-bold text-gray-900">FazzPrint</span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 px-4 py-6 overflow-y-auto">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors touch-manipulation ${
                      isActivePath(item.href)
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-700 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* User menu */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center overflow-hidden">
                  {(() => {
                    console.log('Sidebar - User data:', user);
                    console.log('Sidebar - Profile image URL:', user?.profile_image_url);
                    const imageUrl = user?.profile_image_url;
                    
                    if (imageUrl) {
                      console.log('Sidebar - Attempting to load image:', imageUrl);
                      return (
                        <img
                          src={imageUrl}
                          alt={user.full_name}
                          className="h-8 w-8 object-cover rounded-full"
                          onLoad={() => console.log('Sidebar - Image loaded successfully:', imageUrl)}
                          onError={(e) => {
                            console.log('Sidebar - Image failed to load:', imageUrl);
                            console.log('Sidebar - Error event:', e);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      );
                    } else {
                      console.log('Sidebar - No image URL, showing default icon');
                      return <User className="h-4 w-4 text-white" />;
                    }
                  })()}
                  {!user?.profile_image_url && <User className="h-4 w-4 text-white" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.full_name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            
            <div className="space-y-1">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between h-14 sm:h-16 px-3 sm:px-6 lg:px-8">
            {/* Mobile menu button */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              
              {/* Mobile logo - only show on very small screens when sidebar is closed */}
              <div className="lg:hidden">
                <Link to="/dashboard" className="flex items-center space-x-2">
                  <Printer className="h-6 w-6 text-primary-600" />
                  <span className="hidden xs:block text-lg font-bold text-gray-900">FazzPrint</span>
                </Link>
              </div>
            </div>
            
            {/* Page title - hidden on very small screens */}
            <div className="flex-1 hidden sm:block lg:ml-0">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                {navigation.find(item => isActivePath(item.href))?.name || 'Dashboard'}
              </h1>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Notification Bell with Popup */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg relative transition-colors touch-manipulation"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
                  {/* Notification badge */}
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-4 w-4 sm:h-5 sm:w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Popup */}
                {isNotificationOpen && (
                  <div className="absolute right-0 sm:right-0 mt-2 w-80 sm:w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-80 sm:max-h-96 overflow-hidden transform -translate-x-4 sm:translate-x-0" ref={notificationRef}>
                    <div className="p-3 sm:p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                        <div className="flex items-center space-x-2">
                          {unreadCount > 0 && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {unreadCount} unread
                            </span>
                          )}
                          <button
                            onClick={() => setIsNotificationOpen(false)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors sm:hidden"
                            aria-label="Close notifications"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="max-h-64 sm:max-h-72 overflow-y-auto overscroll-contain">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.notification_id}
                            className={`p-3 sm:p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors touch-manipulation ${
                              !notification.is_read ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                            }`}
                            onClick={() => {
                              // Mark as read if unread
                              if (!notification.is_read) {
                                markAsRead(notification.notification_id)
                              }
                            }}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {notification.title}
                                  </p>
                                  {!notification.is_read && (
                                    <div className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0 ml-2"></div>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatDate(notification.created_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {notifications.length > 0 && (
                      <div className="p-3 border-t border-gray-100 bg-gray-50">
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Mark all as read
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Session Status - compact view for header */}
              <SessionStatus className="hidden md:flex" />
              
              <Link
                to="/profile"
                className="flex items-center space-x-2 p-1 sm:p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
                aria-label="Profile"
              >
                <div className="h-7 w-7 sm:h-8 sm:w-8 bg-primary-600 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-transparent hover:ring-primary-200 transition-all">
                  {(() => {
                    console.log('Header - User data:', user);
                    console.log('Header - Profile image URL:', user?.profile_image_url);
                    const imageUrl = user?.profile_image_url;
                    
                    if (imageUrl) {
                      console.log('Header - Attempting to load image:', imageUrl);
                      return (
                        <img
                          src={imageUrl}
                          alt={user?.full_name || 'Profile'}
                          className="h-7 w-7 sm:h-8 sm:w-8 object-cover rounded-full"
                          onLoad={() => console.log('Header - Image loaded successfully:', imageUrl)}
                          onError={(e) => {
                            console.log('Header - Image failed to load:', imageUrl);
                            console.log('Header - Error event:', e);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      );
                    } else {
                      console.log('Header - No image URL, showing default icon');
                      return <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />;
                    }
                  })()}
                  {!user?.profile_image_url && <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />}
                </div>
                <span className="hidden lg:block text-sm font-medium truncate max-w-24 xl:max-w-32">
                  {user?.full_name}
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AuthenticatedLayout 