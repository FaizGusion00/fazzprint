import React from 'react'
import { Link } from 'react-router-dom'
import { 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Package,
  Calendar,
  Eye,
  TrendingUp,
  BarChart3,
  Activity,
  DollarSign,
  RefreshCw
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useDashboardStats, useOrders, useChartData } from '@/hooks/useOrders'
import LoadingSpinner from '@/components/LoadingSpinner'
import toast from 'react-hot-toast'
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  
  // Use React Query hooks for data fetching with auto-refresh
  const { data: statsResponse, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats()
  const { data: ordersResponse, isLoading: ordersLoading, error: ordersError, refetch: refetchOrders } = useOrders({ 
    per_page: 5, 
    sort_by: 'created_at', 
    sort_order: 'desc' 
  })

  // Fetch chart data with auto-refresh
  const { data: chartResponse, isLoading: chartLoading, error: chartError, refetch: refetchCharts } = useChartData()

  const stats = statsResponse?.data
  const recentOrders = ordersResponse?.data?.orders || []
  const chartData = chartResponse?.data?.data
  
  // Add debugging for chart data and fix type issues
  React.useEffect(() => {
    if (chartResponse) {
      console.log('Chart response:', chartResponse)
      console.log('Chart data:', chartData)
    }
    if (chartError) {
      console.error('Chart error:', chartError)
    }
  }, [chartResponse, chartData, chartError])

  // Safely access chart data with fallbacks
  const ordersChart = (chartData as any)?.orders_trend || []
  const statusChart = (chartData as any)?.status_distribution || []
  const spendingChart = (chartData as any)?.spending_trend || []
  const completionChart = (chartData as any)?.completion_rate || []

  const isLoading = statsLoading || ordersLoading

  // Show error state if any of the critical data fails to load
  if (statsError || ordersError || chartError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Unable to Load Dashboard</h2>
          <p className="text-gray-600 mb-4">
            {statsError ? 'Failed to load statistics. ' : ''}
            {ordersError ? 'Failed to load orders. ' : ''}
            {chartError ? 'Failed to load chart data. ' : ''}
            Please check your connection and try again.
          </p>
          <button
            onClick={() => {
              refetchStats()
              refetchOrders()
              refetchCharts()
            }}
            className="btn btn-primary"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Chart colors
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']

  // Custom tooltip for currency formatting
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ms-MY', {
      style: 'currency',
      currency: 'MYR',
      minimumFractionDigits: 2,
    }).format(value)
  }

  // Manual refresh function
  const handleRefreshAll = async () => {
    await Promise.all([
      refetchStats(),
      refetchOrders(),
      refetchCharts()
    ])
    toast.success('Dashboard refreshed successfully!')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'in_progress':
        return 'text-blue-600 bg-blue-100'
      case 'started':
        return 'text-yellow-600 bg-yellow-100'
      case 'draft':
        return 'text-gray-600 bg-gray-100'
      case 'cancelled':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle
      case 'in_progress':
        return Clock
      case 'started':
        return Package
      default:
        return AlertCircle
    }
  }

  // No data component
  const NoDataChart = ({ title }: { title: string }) => (
    <div className="h-80 flex items-center justify-center">
      <div className="text-center">
        <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-sm font-medium text-gray-900 mb-1">No Data Available</h3>
        <p className="text-sm text-gray-500">
          {title} will appear here once you have some orders
        </p>
      </div>
    </div>
  )

  if (isLoading) {
    return <LoadingSpinner text="Loading dashboard..." />
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {user?.full_name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-primary-100">
              Track your orders, create new print jobs, and manage your printing projects all in one place.
            </p>
          </div>
          
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to="/orders/create"
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Plus className="h-8 w-8 text-primary-600 group-hover:text-primary-700" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">New Order</h3>
              <p className="text-sm text-gray-500">Create a new print job</p>
            </div>
          </div>
        </Link>

        <Link
          to="/orders"
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-blue-600 group-hover:text-blue-700" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">My Orders</h3>
              <p className="text-sm text-gray-500">View all your orders</p>
            </div>
          </div>
        </Link>

        <Link
          to="/track"
          className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-orange-600 group-hover:text-orange-700" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Track Order</h3>
              <p className="text-sm text-gray-500">Check order status</p>
            </div>
          </div>
        </Link>

      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-8 w-8 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.total_orders || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.completed_orders || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.in_progress_orders || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.pending_orders || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Trend Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Orders Trend</h3>
              <p className="text-sm text-gray-500">Monthly order volume over the last 12 months</p>
            </div>
            <TrendingUp className="h-5 w-5 text-primary-600" />
          </div>
          <div className="h-80">
            {chartLoading ? (
              <div className="h-full flex items-center justify-center">
                <LoadingSpinner text="Loading chart..." />
              </div>
            ) : ordersChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ordersChart}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="monthShort" 
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorOrders)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <NoDataChart title="Order trends" />
            )}
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Order Status Distribution</h3>
              <p className="text-sm text-gray-500">Current distribution of order statuses</p>
            </div>
            <BarChart3 className="h-5 w-5 text-primary-600" />
          </div>
          <div className="h-80">
            {chartLoading ? (
              <div className="h-full flex items-center justify-center">
                <LoadingSpinner text="Loading chart..." />
              </div>
            ) : statusChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChart}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, value, percent }) => 
                      `${status}: ${value} (${(percent * 100).toFixed(0)}%)`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusChart.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <NoDataChart title="Status distribution" />
            )}
          </div>
        </div>

        {/* Spending Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Monthly Spending</h3>
              <p className="text-sm text-gray-500">Your spending pattern over the last 12 months</p>
            </div>
            <DollarSign className="h-5 w-5 text-primary-600" />
          </div>
          <div className="h-80">
            {chartLoading ? (
              <div className="h-full flex items-center justify-center">
                <LoadingSpinner text="Loading chart..." />
              </div>
            ) : spendingChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="monthShort" 
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Amount']}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Bar 
                    dataKey="amount" 
                    fill="#10B981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <NoDataChart title="Spending trends" />
            )}
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Completion Rate</h3>
              <p className="text-sm text-gray-500">Order completion percentage over time</p>
            </div>
            <Activity className="h-5 w-5 text-primary-600" />
          </div>
          <div className="h-80">
            {chartLoading ? (
              <div className="h-full flex items-center justify-center">
                <LoadingSpinner text="Loading chart..." />
              </div>
            ) : completionChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={completionChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="monthShort" 
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    fontSize={12}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: number) => [`${value}%`, 'Completion Rate']}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <NoDataChart title="Completion rates" />
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
            <Link
              to="/orders"
              className="text-sm text-primary-600 hover:text-primary-500 font-medium"
            >
              View all orders
            </Link>
          </div>
        </div>
        
        <div className="p-6">
          {recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order) => {
                const StatusIcon = getStatusIcon(order.status)
                return (
                  <div
                    key={order.job_order_id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <StatusIcon className="h-6 w-6 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {order.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {order.job_order_url} • Qty: {order.quantity}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                      
                      {order.due_date && (
                        <span className="text-sm text-gray-500">
                          Due: {new Date(order.due_date).toLocaleDateString()}
                        </span>
                      )}
                      
                      <Link
                        to={`/orders/${order.job_order_id}`}
                        className="text-primary-600 hover:text-primary-500"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first print order.
              </p>
              <div className="mt-6">
                <Link
                  to="/orders/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Order
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage 