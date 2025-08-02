import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  KeyRound
} from 'lucide-react'
import authService, { type ResetTokenValidation } from '@/services/authService'

export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [validatingToken, setValidatingToken] = useState(true)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [tokenValid, setTokenValid] = useState(false)
  const [tokenData, setTokenData] = useState<ResetTokenValidation | null>(null)
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false)

  // Validate token on component mount
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token')
    
    if (!tokenFromUrl) {
      setError('Invalid reset link. Please request a new password reset.')
      setValidatingToken(false)
      return
    }

    setToken(tokenFromUrl)
    validateToken(tokenFromUrl)
  }, [searchParams])

  const validateToken = async (tokenToValidate: string) => {
    try {
      setValidatingToken(true)
      setError('')
      
      const response = await authService.validateResetToken(tokenToValidate)
      
      if (response.success && response.data) {
        setTokenValid(true)
        setTokenData(response.data)
      } else {
        setError('Invalid or expired reset token')
        setTokenValid(false)
      }
    } catch (error: any) {
      setError(error.message)
      setTokenValid(false)
    } finally {
      setValidatingToken(false)
    }
  }

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []
    
    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long')
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number')
    }
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    const passwordErrors = validatePassword(newPassword)
    if (passwordErrors.length > 0) {
      setError(passwordErrors[0])
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await authService.resetPassword({
        token,
        newPassword
      })
      
      if (response.success) {
        setSuccess(response.message)
        setPasswordResetSuccess(true)
        
        // Redirect to login after a delay
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Password reset successful! Please login with your new password.' 
            }
          })
        }, 3000)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrengthColor = (password: string): string => {
    const errors = validatePassword(password)
    if (errors.length === 0) return 'text-green-600'
    if (errors.length <= 2) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPasswordStrengthText = (password: string): string => {
    const errors = validatePassword(password)
    if (!password) return ''
    if (errors.length === 0) return 'Strong password'
    if (errors.length <= 2) return 'Medium strength'
    return 'Weak password'
  }

  // Loading state while validating token
  if (validatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-muted-foreground">Validating reset link...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Invalid token state
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link to="/forgot-password">Request New Reset Link</Link>
              </Button>
              
              <Button asChild variant="ghost" className="w-full">
                <Link to="/login">Back to Login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state after password reset
  if (passwordResetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Password Reset Successful!</CardTitle>
            <CardDescription>
              Your password has been reset successfully. You can now login with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
            
            <Button asChild className="w-full">
              <Link to="/login">Continue to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main reset password form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <KeyRound className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Reset Your Password</CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Token info */}
            {tokenData && (
              <Alert className="border-blue-200 bg-blue-50 text-blue-800">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-medium">Resetting password for: {tokenData.email}</div>
                    <div className="flex items-center text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Link expires in {tokenData.minutesRemaining} minutes
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    className="h-11 pr-10"
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {newPassword && (
                  <p className={`text-xs ${getPasswordStrengthColor(newPassword)}`}>
                    {getPasswordStrengthText(newPassword)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="h-11 pr-10"
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-600">Passwords do not match</p>
                )}
              </div>

              {/* Password requirements */}
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-medium">Password requirements:</p>
                <ul className="space-y-0.5 ml-3">
                  <li className={newPassword.length >= 6 ? 'text-green-600' : ''}>
                    • At least 6 characters long
                  </li>
                  <li className={/(?=.*[a-z])/.test(newPassword) ? 'text-green-600' : ''}>
                    • Contains lowercase letter
                  </li>
                  <li className={/(?=.*[A-Z])/.test(newPassword) ? 'text-green-600' : ''}>
                    • Contains uppercase letter
                  </li>
                  <li className={/(?=.*\d)/.test(newPassword) ? 'text-green-600' : ''}>
                    • Contains a number
                  </li>
                </ul>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11" 
                disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4 mr-2" />
                    Reset Password
                  </>
                )}
              </Button>
            </form>

            <div className="text-center text-xs text-muted-foreground">
              <p>
                Remember your password?{' '}
                <Link to="/login" className="text-blue-600 hover:underline font-medium cursor-pointer">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}