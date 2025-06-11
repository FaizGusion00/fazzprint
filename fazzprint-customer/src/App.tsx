import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/LoadingSpinner'

// Layouts
import PublicLayout from '@/layouts/PublicLayout'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'

// Public Pages
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'

// Protected Pages
import DashboardPage from '@/pages/DashboardPage'
import OrdersPage from '@/pages/OrdersPage'
import CreateOrderPage from '@/pages/CreateOrderPage'
import EditOrderPage from '@/pages/EditOrderPage'
import OrderDetailPage from '@/pages/OrderDetailPage'
import TrackOrderPage from '@/pages/TrackOrderPage'
import ProfilePage from '@/pages/ProfilePage'
import SettingsPage from '@/pages/SettingsPage'

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Public Route component (redirect to dashboard if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          <PublicRoute>
            <PublicLayout>
              <HomePage />
            </PublicLayout>
          </PublicRoute>
        } />
        
        <Route path="/login" element={
          <PublicRoute>
            <PublicLayout>
              <LoginPage />
            </PublicLayout>
          </PublicRoute>
        } />
        
        <Route path="/register" element={
          <PublicRoute>
            <PublicLayout>
              <RegisterPage />
            </PublicLayout>
          </PublicRoute>
        } />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <DashboardPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />

        <Route path="/orders" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <OrdersPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />

        <Route path="/orders/create" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <CreateOrderPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />

        <Route path="/orders/:id/edit" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <EditOrderPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />

        <Route path="/orders/:id" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <OrderDetailPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />

        <Route path="/track" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <TrackOrderPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />

        <Route path="/track/:id" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <TrackOrderPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <ProfilePage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <SettingsPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        } />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App 