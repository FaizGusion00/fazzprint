import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { AuthProvider } from './contexts/AuthContext'
import './index.css'

// Configure toast notifications for admin portal
const toastConfig = {
  position: 'top-right' as const,
  duration: 4000,
  style: {
    borderRadius: '12px',
    background: '#fff',
    color: '#1f2937',
    border: '1px solid #e5e7eb',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    fontSize: '14px',
    fontWeight: '500',
    maxWidth: '420px',
  },
  success: {
    iconTheme: {
      primary: '#10b981',
      secondary: '#fff',
    },
  },
  error: {
    iconTheme: {
      primary: '#ef4444',
      secondary: '#fff',
    },
  },
  loading: {
    iconTheme: {
      primary: '#6366f1',
      secondary: '#fff',
    },
  },
}

// Initialize React app
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

// Render app with all providers
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster toastOptions={toastConfig} />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)

// Service worker registration for offline capabilities (optional)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration)
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}

// Enable hot module replacement in development
if (import.meta.hot) {
  import.meta.hot.accept()
} 