import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import LoadingSpinner from './components/LoadingSpinner'

// Pages - will be created next
import LoginPage from './pages/LoginPage'
import SalesManagerDashboard from './pages/SalesManagerDashboard'
import StaffDashboard from './pages/StaffDashboard'

// Protected Route wrapper component
interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('sales_manager' | 'staff')[]
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = ['sales_manager', 'staff'] 
}) => {
  const { isAuthenticated, isLoading, role } = useAuth()

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner fullscreen text="Verifying access..." />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Check role permissions
  if (role && !allowedRoles.includes(role as 'sales_manager' | 'staff')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg bg-white p-8 shadow-lg">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-100 p-3">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-gray-900">Access Denied</h2>
            <p className="mt-2 text-sm text-gray-600">
              You don't have permission to access this area. 
              <br />
              Required roles: {allowedRoles.join(', ')}
              <br />
              Your role: {role}
            </p>
            <button
              onClick={() => window.location.href = '/login'}
              className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Main App component
const App: React.FC = () => {
  const { isAuthenticated, isLoading, role } = useAuth()

  // Show loading spinner during initial auth check
  if (isLoading) {
    return <LoadingSpinner fullscreen text="Loading FazzPrint Admin..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate 
                to={
                  role === 'sales_manager' 
                    ? '/dashboard/sales' 
                    : role === 'staff' 
                    ? '/dashboard/staff' 
                    : '/dashboard/sales'
                } 
                replace 
              />
            ) : (
              <LoginPage />
            )
          }
        />

        {/* Protected routes */}
        <Route
          path="/dashboard/sales"
          element={
            <ProtectedRoute allowedRoles={['sales_manager']}>
              <SalesManagerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/staff"
          element={
            <ProtectedRoute allowedRoles={['staff']}>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        {/* Default route - redirect based on role */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate 
                to={
                  role === 'sales_manager' 
                    ? '/dashboard/sales' 
                    : role === 'staff' 
                    ? '/dashboard/staff' 
                    : '/dashboard/sales'  // Default for admin
                } 
                replace 
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Catch-all route */}
        <Route
          path="*"
          element={
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
              <div className="rounded-lg bg-white p-8 text-center shadow-lg">
                <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 p-3">
                  <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h2 className="mt-4 text-lg font-semibold text-gray-900">Page Not Found</h2>
                <p className="mt-2 text-sm text-gray-600">
                  The page you're looking for doesn't exist.
                </p>
                <button
                  onClick={() => window.location.href = '/'}
                  className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          }
        />
      </Routes>
    </div>
  )
}

export default App 