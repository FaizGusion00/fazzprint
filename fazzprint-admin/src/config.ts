// Centralized configuration for API server switching
// Switch between development and production servers using VITE_USE_PROD_API

const IS_PROD = import.meta.env.VITE_USE_PROD_API === 'true'

export const API_BASE_URL = IS_PROD
  ? import.meta.env.VITE_API_BASE_URL_PROD || 'https://api.fazzprint.com/api'
  : import.meta.env.VITE_API_BASE_URL_DEV || 'http://localhost:8000/api'

export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'FazzPrint Admin Portal',
  environment: import.meta.env.VITE_APP_ENV || 'development',
  isProduction: IS_PROD,
  apiBaseUrl: API_BASE_URL,
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
  defaultRole: import.meta.env.VITE_DEFAULT_ROLE || 'sales_manager',
  enableQRScanner: import.meta.env.VITE_ENABLE_QR_SCANNER === 'true',
  enableRealTimeUpdates: import.meta.env.VITE_ENABLE_REAL_TIME_UPDATES === 'true',
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true'
}

// Log configuration in development
if (import.meta.env.DEV) {
  console.log('🔧 App Configuration:', {
    environment: APP_CONFIG.environment,
    isProduction: APP_CONFIG.isProduction,
    apiBaseUrl: APP_CONFIG.apiBaseUrl,
    defaultRole: APP_CONFIG.defaultRole
  })
} 