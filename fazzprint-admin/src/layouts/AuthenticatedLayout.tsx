import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface AuthenticatedLayoutProps {
  children: React.ReactNode
}

const AuthenticatedLayout: React.FC<AuthenticatedLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row h-auto sm:h-16 items-center justify-between py-3 sm:py-0">
            {/* Logo and title */}
            <div className="flex items-center w-full sm:w-auto justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">FazzPrint Admin</h1>
                <p className="text-xs text-gray-500">
                  {user?.role === 'sales_manager' ? 'Sales Manager Portal' : 'Staff Portal'}
                </p>
              </div>
              {/* Mobile menu button */}
              <button
                className="sm:hidden ml-auto p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Open user menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            {/* User menu */}
            <div className={`flex-col sm:flex-row flex items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-3 sm:mt-0 w-full sm:w-auto ${menuOpen ? 'flex' : 'hidden sm:flex'}`}>
              <div className="text-right w-full sm:w-auto">
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
                className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 w-full sm:w-auto"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>
      {/* Main content */}
      <main className="mx-auto max-w-7xl px-2 sm:px-4 py-6 sm:py-8 lg:px-8">
        {children}
      </main>
    </div>
  )
}

export default AuthenticatedLayout 