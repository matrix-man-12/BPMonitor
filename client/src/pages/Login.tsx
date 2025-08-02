import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Activity, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'


export function Login() {
  const navigate = useNavigate()
  const { login, isAuthenticated, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Debug component mount/unmount
  useEffect(() => {
    console.log('🏠 Login component mounted')
    return () => {
      console.log('💥 Login component unmounted - THIS INDICATES A RELOAD!')
    }
  }, [])

  // Redirect if already authenticated (but not during login process)
  useEffect(() => {
    console.log('🔄 Auth state changed:', { isAuthenticated, isLoggingIn, authLoading, loading })
    
    // TEMPORARILY DISABLED to test if this is causing the reload
    // if (isAuthenticated && !isLoggingIn && !loading) {
    //   console.log('🚀 Navigating to dashboard')
    //   navigate('/dashboard', { replace: true })
    // }
  }, [isAuthenticated, navigate, isLoggingIn, authLoading, loading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('🔍 Login form submitted:', { email, loading })
    
    if (loading || isLoggingIn) {
      console.log('⚠️ Already loading, preventing double submission')
      return
    }
    
    // Basic validation
    if (!email || !password) {
      console.log('❌ Validation failed: missing email or password')
      setError('Please enter both email and password')
      return
    }
    
    console.log('📝 Starting login process...')
    setLoading(true)
    setIsLoggingIn(true) // Prevent navigation during login
    setError('')

    try {
      console.log('🚀 Calling login function...')
      const result = await login(email, password)
      console.log('📋 Login result:', result)
      
      if (result.success) {
        console.log('✅ Login successful, clearing form')
        // Clear form on success
        setEmail('')
        setPassword('')
        // Navigation will be handled by the useEffect hook after isLoggingIn is set to false
      } else {
        console.log('❌ Login failed:', result.message)
        setError(result.message || 'Login failed')
        setIsLoggingIn(false) // Allow normal behavior on error
        // Don't clear the form on error - user might want to correct and retry
      }
    } catch (error) {
      console.error('💥 Login submission error:', error)
      setError('An unexpected error occurred. Please try again.')
      setIsLoggingIn(false) // Allow normal behavior on error
    } finally {
      console.log('🏁 Setting loading to false')
      setLoading(false)
      // Only reset isLoggingIn on success to allow navigation
      if (!error) {
        setTimeout(() => setIsLoggingIn(false), 100) // Small delay to allow state to settle
      }
    }
  }



  // Clear error when user starts typing
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (error) setError('')
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    if (error) setError('')
  }

  return (
    <div className="min-h-screen dashboard-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg cursor-pointer">
              <Activity className="h-8 w-8" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to continue tracking your health</p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="dashboard-card border-0 shadow-xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form 
              onSubmit={(e) => {
                console.log('📝 Form onSubmit triggered')
                handleSubmit(e)
              }} 
              className="space-y-4" 
              noValidate
            >
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm font-medium">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium cursor-pointer">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={handleEmailChange}
                    className="pl-10 cursor-pointer"
                    required
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium cursor-pointer">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={handlePasswordChange}
                    className="pl-10 pr-10 cursor-pointer"
                    required
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent cursor-pointer"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <Link 
                  to="/forgot-password" 
                  className="text-primary hover:underline cursor-pointer"
                  tabIndex={loading ? -1 : 0}
                >
                  Forgot password?
                </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 cursor-pointer"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button 
                type="button" 
                variant="outline" 
                className="w-full cursor-pointer"
                disabled={loading}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Continue with Google
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sign Up Link */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Link 
            to="/register" 
            className="text-primary hover:underline font-medium cursor-pointer"
          >
            Sign up
          </Link>
        </div>


      </div>
    </div>
  )
} 