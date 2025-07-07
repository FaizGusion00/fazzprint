import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { apiService } from '../services/api'
import toast from 'react-hot-toast'

interface Task {
  process_id: number
  status: string
  processStep: {
    name: string
    jobOrder: {
      job_order_id: number
      title: string
      customer: { full_name: string }
    }
  }
  priority?: string
  elapsed_time?: number
}

interface QRWork {
  qr_code_id: number
  jobOrder: {
    job_order_id: number
    title: string
    customer: { full_name: string }
  }
}

interface WorkHistoryItem {
  process_id: number
  status: string
  processStep: {
    name: string
    jobOrder: {
      job_order_id: number
      title: string
      customer: { full_name: string }
    }
  }
  quantity_completed?: number
  elapsed_time?: number
  created_at: string
}

const StaffDashboard: React.FC = () => {
  const { user, isLoading: authLoading, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTasks, setActiveTasks] = useState<Task[]>([])
  const [availableWork, setAvailableWork] = useState<QRWork[]>([])
  const [workHistory, setWorkHistory] = useState<WorkHistoryItem[]>([])
  const [summary, setSummary] = useState<{ active_count: number, available_count: number, total_active_time: number, completed_today: number }>({ active_count: 0, available_count: 0, total_active_time: 0, completed_today: 0 })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch my-tasks
      const myTasksRes = await apiService.get<any>('/staff/my-tasks')
      if (myTasksRes.success) {
        setActiveTasks(myTasksRes.data.active_processes || [])
        setAvailableWork(myTasksRes.data.available_work || [])
        setSummary(myTasksRes.data.summary || { active_count: 0, available_count: 0, total_active_time: 0 })
      } else {
        throw new Error(myTasksRes.message)
      }
      // Fetch work history (first page)
      const historyRes = await apiService.get<any>('/staff/work-history')
      if (historyRes.success) {
        setWorkHistory(historyRes.data.data || [])
      } else {
        throw new Error(historyRes.message)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load staff dashboard')
      toast.error('Failed to load staff dashboard')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return <LoadingSpinner fullscreen text="Loading dashboard..." />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <h2 className="text-lg font-semibold text-red-600 mb-2">Error</h2>
          <p className="mb-4">{error}</p>
          <button className="btn btn-primary" onClick={fetchDashboardData}>Retry</button>
        </div>
      </div>
    )
  }

  const handleLogout = () => {
    logout()
  }

  // Helper for formatting time (minutes to h:mm)
  const formatTime = (minutes?: number) => {
    if (!minutes) return '0h 0m'
    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    return `${h}h ${m}m`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="navbar">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and title */}
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">FazzPrint Admin</h1>
                <p className="text-xs text-gray-500">Staff Portal</p>
              </div>
            </div>
            {/* User menu */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600">
                  {user?.full_name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-outline btn-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.full_name}!
          </h2>
          <p className="mt-1 text-gray-600">
            Manage your tasks and track production processes efficiently.
          </p>
        </div>
        {/* Quick stats */}
        <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-8">
          <div className="card">
            <div className="card-content">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">My Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.active_count}</p>
                  <p className="text-xs text-blue-600">Active</p>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-content">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Available Work</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.available_count}</p>
                  <p className="text-xs text-green-600">Ready to start</p>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-content">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Active Time</p>
                  <p className="text-2xl font-bold text-gray-900">{formatTime(summary.total_active_time)}</p>
                  <p className="text-xs text-yellow-600">Today</p>
                </div>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-content">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed Today</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.completed_today ?? 0}</p>
                  <p className="text-xs text-purple-600">Tasks done</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Quick actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button className="btn btn-primary btn-lg p-4 h-auto flex-col">
              <svg className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4" />
              </svg>
              <span>Scan QR Code</span>
            </button>
            <button className="btn btn-outline btn-lg p-4 h-auto flex-col">
              <svg className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>View Tasks</span>
            </button>
            <button className="btn btn-outline btn-lg p-4 h-auto flex-col">
              <svg className="h-6 w-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Work History</span>
            </button>
          </div>
        </div>
        {/* Active tasks and process sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Active Tasks</h3>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                {activeTasks.length === 0 && (
                  <div className="text-gray-500 text-center">No active tasks</div>
                )}
                {activeTasks.map((task) => (
                  <div key={task.process_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {task.processStep && task.processStep.jobOrder
                          ? `Order #${task.processStep.jobOrder.job_order_id} - ${task.processStep.jobOrder.title}`
                          : <span className="text-gray-400 italic">N/A</span>
                        }
                      </p>
                      <p className="text-sm text-gray-500">
                        {task.processStep ? task.processStep.name : <span className="text-gray-400 italic">N/A</span>}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`badge ${task.status === 'active' ? 'badge-primary' : 'badge-warning'}`}>{task.status}</span>
                      <span className="text-xs text-gray-400">{formatTime(task.elapsed_time)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <button className="w-full btn btn-outline">View All Tasks</button>
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Available Work</h3>
            </div>
            <div className="card-content">
              <div className="space-y-4">
                {availableWork.length === 0 && (
                  <div className="text-gray-500 text-center">No available work</div>
                )}
                {availableWork.map((work) => (
                  <div key={work.qr_code_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {work.jobOrder
                          ? `Order #${work.jobOrder.job_order_id} - ${work.jobOrder.title}`
                          : <span className="text-gray-400 italic">N/A</span>
                        }
                      </p>
                      <p className="text-sm text-gray-500">
                        {work.jobOrder && work.jobOrder.customer
                          ? `Customer: ${work.jobOrder.customer.full_name}`
                          : <span className="text-gray-400 italic">N/A</span>
                        }
                      </p>
                    </div>
                    <button className="btn btn-primary btn-sm">Scan QR</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Work history */}
        <div className="mt-8 card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Work History</h3>
          </div>
          <div className="card-content">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Process</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {workHistory.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center text-gray-500 py-4">No work history found</td>
                    </tr>
                  )}
                  {workHistory.map((item) => (
                    <tr key={item.process_id}>
                      <td className="px-4 py-2">
                        {item.processStep && item.processStep.jobOrder
                          ? `#${item.processStep.jobOrder.job_order_id} - ${item.processStep.jobOrder.title}`
                          : <span className="text-gray-400 italic">N/A</span>
                        }
                      </td>
                      <td className="px-4 py-2">
                        {item.processStep ? item.processStep.name : <span className="text-gray-400 italic">N/A</span>}
                      </td>
                      <td className="px-4 py-2">{item.status ?? <span className="text-gray-400 italic">N/A</span>}</td>
                      <td className="px-4 py-2">{item.quantity_completed ?? '-'}</td>
                      <td className="px-4 py-2">{formatTime(item.elapsed_time)}</td>
                      <td className="px-4 py-2">{item.created_at ? new Date(item.created_at).toLocaleString() : <span className="text-gray-400 italic">N/A</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default StaffDashboard