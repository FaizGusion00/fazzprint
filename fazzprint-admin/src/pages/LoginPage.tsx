import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { LoginData } from '../types'

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, isLoading } = useAuth()
  const [formData, setFormData] = useState<LoginData>({
    login: '',
    password: '',
    remember_me: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.login.trim()) {
      newErrors.login = 'Username, email, or phone is required'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const success = await login(formData)
      if (!success) {
        // Login function handles toast notifications
        setFormData(prev => ({ ...prev, password: '' }))
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setFormData(prev => ({ ...prev, password: '' }))
    } finally {
      setIsSubmitting(false)
    }
  }

  const demoCredentials = [
    { role: 'Sales Manager', username: 'sales_manager', password: 'sales123' },
    { role: 'Staff', username: 'staff1', password: 'staff123' }
  ]

  const fillDemoCredentials = (username: string, password: string) => {
    setFormData(prev => ({
      ...prev,
      login: username,
      password: password
    }))
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      {/* Left side - Brand & Info */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:px-12">
        <div className="mx-auto max-w-lg">
          {/* Logo */}
          <div className="mb-8 flex items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-3">
              <h1 className="text-2xl font-bold text-gray-900">FazzPrint</h1>
              <p className="text-sm text-gray-600">Admin Portal</p>
            </div>
          </div>

          {/* Welcome message */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome back to your workspace
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Access your admin dashboard to manage orders, processes, and oversee operations with powerful tools designed for efficiency.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
                <svg className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="ml-3 text-gray-700">Role-based access control</span>
            </div>
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
                <svg className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="ml-3 text-gray-700">Real-time order tracking</span>
            </div>
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-100">
                <svg className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="ml-3 text-gray-700">Advanced analytics & insights</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center justify-center lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="ml-3">
              <h1 className="text-2xl font-bold text-gray-900">FazzPrint Admin</h1>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Sign in to your account</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Enter your credentials to access the admin dashboard
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                  <label htmlFor="login" className="form-label">
                    Username, Email, or Phone
                  </label>
                  <input
                    id="login"
                    name="login"
                    type="text"
                    autoComplete="username"
                    value={formData.login}
                    onChange={handleInputChange}
                    placeholder="Enter your username, email, or phone"
                    className={`input ${errors.login ? 'input-error' : ''}`}
                    disabled={isSubmitting}
                  />
                  {errors.login && <p className="form-error">{errors.login}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className={`input ${errors.password ? 'input-error' : ''}`}
                    disabled={isSubmitting}
                  />
                  {errors.password && <p className="form-error">{errors.password}</p>}
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      name="remember_me"
                      type="checkbox"
                      checked={formData.remember_me}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      disabled={isSubmitting}
                    />
                    <span className="ml-2 text-sm text-gray-600">Remember me</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="btn btn-primary btn-lg w-full"
                >
                  {isSubmitting || isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    'Sign in'
                  )}
                </button>
              </form>

              {/* Demo credentials for development */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-white px-2 text-gray-500">Demo Accounts</span>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {demoCredentials.map((cred, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => fillDemoCredentials(cred.username, cred.password)}
                        className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-left text-sm hover:bg-gray-50"
                        disabled={isSubmitting}
                      >
                        <span className="font-medium text-gray-700">{cred.role}</span>
                        <span className="text-xs text-gray-500">{cred.username}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-gray-500">
            © 2024 FazzPrint. All rights reserved. | Admin Portal v1.0
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage 