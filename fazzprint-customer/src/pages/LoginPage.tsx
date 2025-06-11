import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Printer, LogIn } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { LoginData } from '@/types'

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = React.useState(false)
  const { login, isLoading, getSavedCredentials } = useAuth()
  const { showSuccess, showError } = useToast()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginData>()

  // Load saved credentials on component mount
  React.useEffect(() => {
    const savedCredentials = getSavedCredentials()
    if (savedCredentials) {
      console.log('Loading saved credentials for user:', savedCredentials.login)
      setValue('login', savedCredentials.login)
      setValue('password', savedCredentials.password)
      setValue('remember_me', true)
    }
  }, [getSavedCredentials, setValue])

  const rememberMeValue = watch('remember_me')

  const onSubmit = async (data: LoginData) => {
    try {
      const success = await login(data)
      if (success) {
        showSuccess('Login Successful', 'Welcome back! You have been logged in successfully.')
        navigate('/dashboard')
      }
    } catch (error) {
      showError('Login Failed', 'Invalid credentials. Please check your email/username and password.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="flex items-center space-x-2">
              <Printer className="h-10 w-10 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">FazzPrint</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              to="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              create a new account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="login" className="block text-sm font-medium text-gray-700">
                Email, username, or phone number
              </label>
              <div className="mt-1">
                <input
                  id="login"
                  type="text"
                  autoComplete="username"
                  className={`input ${errors.login ? 'border-red-500' : ''}`}
                  placeholder="Enter your email, username, or phone"
                  {...register('login', {
                    required: 'Email, username, or phone is required',
                  })}
                />
                {errors.login && (
                  <p className="mt-1 text-sm text-red-600">{errors.login.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`input pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="Enter your password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember_me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  {...register('remember_me')}
                />
                <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              {/* <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  Forgot your password?
                </a>
              </div> */}
            </div>

            {/* Remember me explanation */}
            {rememberMeValue && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Remember me enabled:</span> Your login credentials will be saved securely 
                  on this device for 30 days, so you won't need to enter them again.
                </p>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn className="h-5 w-5 text-primary-500 group-hover:text-primary-400" />
              </span>
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              New to FazzPrint?{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Create an account
              </Link>
            </p>
          </div>
        </form>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Demo Credentials</h3>
          <div className="text-xs text-blue-600 space-y-1">
            <p><strong>Email:</strong> customer@example.com</p>
            <p><strong>Password:</strong> password123</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage 