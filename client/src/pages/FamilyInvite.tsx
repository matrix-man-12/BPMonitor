import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Users, 
  Clock, 
  Crown,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowRight
} from 'lucide-react'
import familyService, { type InvitePreview } from '@/services/familyService'
import { useAuth } from '@/hooks/useAuth'

export function FamilyInvite() {
  const { inviteCode } = useParams<{ inviteCode: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  
  const [preview, setPreview] = useState<InvitePreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    if (!inviteCode) {
      setError('Invalid invite link')
      setLoading(false)
      return
    }

    fetchInvitePreview()
  }, [inviteCode])

  const fetchInvitePreview = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const previewData = await familyService.getInvitePreview(inviteCode!)
      setPreview(previewData)
      
      if (previewData.isExpired) {
        setError('This invite link has expired')
      }
    } catch (error: any) {
      console.error('Failed to fetch invite preview:', error)
      setError(error.message || 'Failed to load invite')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinGroup = async () => {
    if (!isAuthenticated) {
      // Redirect to login with return path
      navigate(`/login?redirect=/family/join/${inviteCode}`)
      return
    }

    try {
      setJoining(true)
      setError(null)
      
      await familyService.joinFamilyGroupByLink(inviteCode!)
      setJoined(true)
      
      // Redirect to family groups page after 2 seconds
      setTimeout(() => {
        navigate('/family')
      }, 2000)
    } catch (error: any) {
      console.error('Failed to join family group:', error)
      setError(error.message || 'Failed to join family group')
    } finally {
      setJoining(false)
    }
  }

  const handleGoToLogin = () => {
    navigate(`/login?redirect=/family/join/${inviteCode}`)
  }

  const handleGoToRegister = () => {
    navigate(`/register?redirect=/family/join/${inviteCode}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen dashboard-gradient flex items-center justify-center p-4">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading invite...</span>
        </div>
      </div>
    )
  }

  if (error || !preview) {
    return (
      <div className="min-h-screen dashboard-gradient flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Invalid Invite</h2>
            <p className="text-muted-foreground mb-6">
              {error || 'This invite link is not valid or has expired.'}
            </p>
            <Button onClick={() => navigate('/family')} className="cursor-pointer">
              Go to Family Groups
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (joined) {
    return (
      <div className="min-h-screen dashboard-gradient flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-semibold mb-2">Welcome to the Family!</h2>
            <p className="text-muted-foreground mb-6">
              You've successfully joined <strong>{preview.groupName}</strong>. 
              You'll be redirected to your family groups shortly.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Redirecting...
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen dashboard-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg cursor-pointer">
              <Users className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">You're Invited!</h1>
          <p className="text-muted-foreground">Join a family group to track health together</p>
        </div>

        {/* Family Group Preview */}
        <Card className="dashboard-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white cursor-pointer">
                <Users className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">{preview.groupName}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Crown className="h-3 w-3" />
                  Created by {preview.adminName}
                </div>
              </div>
            </div>
            {preview.description && (
              <p className="text-sm text-muted-foreground mt-2">{preview.description}</p>
            )}
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Group Stats */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[...Array(Math.min(preview.memberCount, 3))].map((_, i) => (
                    <Avatar key={i} className="h-8 w-8 border-2 border-background">
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white text-xs">
                        {String.fromCharCode(65 + i)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {preview.memberCount > 3 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted border-2 border-background">
                      <span className="text-xs font-medium">+{preview.memberCount - 3}</span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium">{preview.memberCount} members</div>
                  <div className="text-xs text-muted-foreground">Active family group</div>
                </div>
              </div>
            </div>

            {/* Expiry Warning */}
            <Alert variant={familyService.isInviteExpired(preview.expiresAt) ? "destructive" : "default"}>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                {familyService.isInviteExpired(preview.expiresAt) 
                  ? 'This invite has expired'
                  : `Expires ${familyService.getTimeRemaining(preview.expiresAt)}`
                }
              </AlertDescription>
            </Alert>

            {/* Join Actions */}
            {!isAuthenticated ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  Sign in or create an account to join this family group
                </p>
                <div className="space-y-2">
                  <Button 
                    onClick={handleGoToLogin} 
                    className="w-full cursor-pointer"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Sign In to Join
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleGoToRegister} 
                    className="w-full cursor-pointer"
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-900 dark:text-blue-100">
                      Signed in as <strong>{user?.firstName} {user?.lastName}</strong>
                    </span>
                  </div>
                </div>
                
                <Button 
                  onClick={handleJoinGroup} 
                  disabled={joining || familyService.isInviteExpired(preview.expiresAt)}
                  className="w-full cursor-pointer"
                >
                  {joining ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      Join {preview.groupName}
                    </>
                  )}
                </Button>
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Family groups help you track health together and share blood pressure readings 
            with your loved ones.
          </p>
        </div>
      </div>
    </div>
  )
} 