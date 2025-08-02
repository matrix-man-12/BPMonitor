import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Mail, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import authService from '@/services/authService'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('Email is required')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await authService.forgotPassword({ email })
      
      if (response.success) {
        setSuccess(response.message)
        setEmailSent(true)
        
        // Clear form
        setEmail('')
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    navigate('/login')
  }

  const handleResendEmail = () => {
    setEmailSent(false)
    setSuccess('')
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                <Mail className="h-6 w-6" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
            <CardDescription>
              {emailSent 
                ? "We've sent you a password reset link" 
                : "Enter your email address and we'll send you a link to reset your password"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {emailSent ? (
              // Success state after email is sent
              <div className="space-y-4">
                <div className="flex items-center justify-center mb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg">Check your email</h3>
                  <p className="text-sm text-muted-foreground">
                    We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
                  </p>
                </div>

                <Alert className="border-blue-200 bg-blue-50 text-blue-800">
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Didn't receive the email?</strong>
                    <ul className="mt-2 text-xs space-y-1">
                      <li>• Check your spam/junk folder</li>
                      <li>• Make sure you entered the correct email</li>
                      <li>• The link expires in 30 minutes</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Button 
                    onClick={handleResendEmail}
                    variant="outline" 
                    className="w-full"
                  >
                    Send Another Email
                  </Button>
                  
                  <Button 
                    onClick={handleBackToLogin}
                    variant="ghost" 
                    className="w-full"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </div>
              </div>
            ) : (
              // Initial form state
              <>
                {success && (
                  <Alert className="border-green-200 bg-green-50 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
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
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="h-11"
                      autoComplete="email"
                      autoFocus
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11" 
                    disabled={loading || !email}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending Reset Link...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Reset Link
                      </>
                    )}
                  </Button>
                </form>

                <div className="text-center">
                  <Button 
                    onClick={handleBackToLogin}
                    variant="ghost" 
                    className="text-sm"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Button>
                </div>

                <div className="text-center text-xs text-muted-foreground">
                  <p>
                    Remember your password?{' '}
                    <Link to="/login" className="text-blue-600 hover:underline font-medium">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Additional help text */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>
            Need help? Contact our support team for assistance with your account.
          </p>
        </div>
      </div>
    </div>
  )
}