import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import AuthenticatedLayout from '../layouts/AuthenticatedLayout'
import { apiService } from '../services/api'
import toast from 'react-hot-toast'
import {
  ClipboardList,
  Clock,
  DollarSign,
  Users,
  PlusCircle,
  FileText,
  QrCode,
  BarChart3,
  AlertCircle
} from 'lucide-react'

interface DashboardStats {
  pending_orders: number
  active_jobs: number
  completed_jobs: number
  total_revenue: number
  pending_payments: number
  confirmed_payments: number
  customer_count: number
  pending_orders_change: number
  revenue_change: number
}

interface RecentOrder {
  job_order_id: number
  title: string
  customer: {
    full_name: string
  }
  created_at: string
  status: string
  payment_status: string
  quoted_price: number | null
  final_price: number | null
}

const SalesManagerDashboard: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const [statsRes, ordersRes] = await Promise.all([
        apiService.get<DashboardStats>('/sales/dashboard/stats'),
        apiService.get<RecentOrder[]>('/sales/orders/recent')
      ])
      
      if (statsRes.success && ordersRes.success) {
        setStats(statsRes.data || null)
        setRecentOrders(ordersRes.data || [])
      } else {
        throw new Error('Failed to load dashboard data')
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      setError(error.message || 'Failed to load dashboard data')
      toast.error('Failed to load dashboard data. Please try refreshing the page.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'partial':
        return 'bg-yellow-100 text-yellow-800'
      case 'pending':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (authLoading || isLoading) {
    return <LoadingSpinner fullscreen text="Loading dashboard..." />
  }

  const dashboardContent = (
    <>
      {/* Welcome section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.full_name}!
        </h2>
        <p className="mt-1 text-gray-600">
          Here's your sales operations overview.
        </p>
      </div>

      {error ? (
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p>{error}</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="mt-2 text-sm font-medium text-red-600 hover:text-red-500"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Quick stats */}
          <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-8">
            {/* Pending Orders */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.pending_orders || 0}</p>
                  <p className={`text-xs ${(stats?.pending_orders_change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(stats?.pending_orders_change || 0) >= 0 ? '+' : ''}{stats?.pending_orders_change || 0}% from last week
                  </p>
                </div>
              </div>
            </div>

            {/* Active Jobs */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <ClipboardList className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.active_jobs || 0}</p>
                  <p className="text-xs text-blue-600">In progress</p>
                </div>
              </div>
            </div>

            {/* Revenue */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.total_revenue || 0)}</p>
                  <p className={`text-xs ${(stats?.revenue_change || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(stats?.revenue_change || 0) >= 0 ? '+' : ''}{stats?.revenue_change || 0}% from last month
                  </p>
                </div>
              </div>
            </div>

            {/* Customers */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.customer_count || 0}</p>
                  <p className="text-xs text-purple-600">With active orders</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <button 
                onClick={() => navigate('/jobs/create')}
                className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg p-4 flex flex-col items-center justify-center transition-colors"
              >
                <PlusCircle className="h-6 w-6 mb-2" />
                <span>Create Job</span>
              </button>

              <button 
                onClick={() => navigate('/orders')}
                className="bg-white hover:bg-gray-50 text-gray-800 rounded-lg p-4 flex flex-col items-center justify-center transition-colors border border-gray-200"
              >
                <FileText className="h-6 w-6 mb-2" />
                <span>View Orders</span>
              </button>

              <button 
                onClick={() => navigate('/qr-codes')}
                className="bg-white hover:bg-gray-50 text-gray-800 rounded-lg p-4 flex flex-col items-center justify-center transition-colors border border-gray-200"
              >
                <QrCode className="h-6 w-6 mb-2" />
                <span>Generate QR</span>
              </button>

              <button 
                onClick={() => navigate('/analytics')}
                className="bg-white hover:bg-gray-50 text-gray-800 rounded-lg p-4 flex flex-col items-center justify-center transition-colors border border-gray-200"
              >
                <BarChart3 className="h-6 w-6 mb-2" />
                <span>Analytics</span>
              </button>
            </div>
          </div>

          {/* Recent orders */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <tr key={order.job_order_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">#{order.job_order_id}</div>
                          <div className="text-sm text-gray-500">{order.title}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{order.customer.full_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusBadgeClass(order.payment_status)}`}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.final_price ? formatCurrency(order.final_price) : (order.quoted_price ? formatCurrency(order.quoted_price) : '-')}
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No recent orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  )

  return (
    <AuthenticatedLayout>
      {dashboardContent}
    </AuthenticatedLayout>
  )
}

export default SalesManagerDashboard 