import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  User, 
  Mail, 
  Calendar, 
  Bell, 
  Shield, 
  Heart,
  Users,
  Save,
  Camera,
  Key
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function Profile() {
  const { user, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    dateOfBirth: user?.dateOfBirth || ''
  })
  const [notifications, setNotifications] = useState({
    enabled: user?.notificationPreferences?.enabled || false,
    email: user?.notificationPreferences?.email || false,
    frequency: user?.notificationPreferences?.frequency || 'daily',
    times: user?.notificationPreferences?.times || ['09:00', '21:00']
  })

  const handleSaveProfile = async () => {
    setLoading(true)
    try {
      await updateProfile(profileData)
      // Add success notification here
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationChange = (key: string, value: any) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'Not set'
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return `${age} years old`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>
      </div>

      {/* Profile Overview Card */}
      <Card className="dashboard-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src="" alt={user?.firstName} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <Button 
                size="icon" 
                variant="secondary" 
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{user?.firstName} {user?.lastName}</h2>
              <p className="text-muted-foreground">{user?.email}</p>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="secondary" className="gap-1">
                  <Calendar className="h-3 w-3" />
                  {calculateAge(user?.dateOfBirth || '')}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Users className="h-3 w-3" />
                  {user?.familyGroups?.length || 0} Family Groups
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Tabs */}
      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Account Settings */}
        <TabsContent value="account" className="space-y-6">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">First Name</label>
                  <Input
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Last Name</label>
                  <Input
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Email Address</label>
                <Input
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  placeholder="Enter your email"
                  type="email"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Date of Birth</label>
                <Input
                  value={profileData.dateOfBirth}
                  onChange={(e) => setProfileData({...profileData, dateOfBirth: e.target.value})}
                  type="date"
                />
              </div>
              <Button onClick={handleSaveProfile} disabled={loading} className="gap-2">
                <Save className="h-4 w-4" />
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          {/* Health Stats */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Health Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <div className="text-3xl font-bold text-red-500">156</div>
                  <div className="text-sm text-muted-foreground">Total Readings</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <div className="text-3xl font-bold text-green-500">125/80</div>
                  <div className="text-sm text-muted-foreground">Avg BP (30 days)</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/30">
                  <div className="text-3xl font-bold text-blue-500">94%</div>
                  <div className="text-sm text-muted-foreground">Goal Achievement</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Enable Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive reminders to take your blood pressure readings
                  </p>
                </div>
                <Switch
                  checked={notifications.enabled}
                  onCheckedChange={(checked) => handleNotificationChange('enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive email summaries and important updates
                  </p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                />
              </div>

              <div>
                <h4 className="font-medium mb-2">Reminder Times</h4>
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <label className="text-sm text-muted-foreground">Morning</label>
                    <Input
                      type="time"
                      value={notifications.times[0]}
                      onChange={(e) => {
                        const newTimes = [...notifications.times]
                        newTimes[0] = e.target.value
                        handleNotificationChange('times', newTimes)
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Evening</label>
                    <Input
                      type="time"
                      value={notifications.times[1]}
                      onChange={(e) => {
                        const newTimes = [...notifications.times]
                        newTimes[1] = e.target.value
                        handleNotificationChange('times', newTimes)
                      }}
                    />
                  </div>
                </div>
              </div>

              <Button className="gap-2">
                <Save className="h-4 w-4" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <h4 className="font-medium">Password</h4>
                  <p className="text-sm text-muted-foreground">
                    Last changed 3 months ago
                  </p>
                </div>
                <Button variant="outline" className="gap-2">
                  <Key className="h-4 w-4" />
                  Change Password
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <h4 className="font-medium">Email Verification</h4>
                  <p className="text-sm text-muted-foreground">
                    Your email is verified
                  </p>
                </div>
                <Badge variant="default">Verified</Badge>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Button variant="outline">
                  Enable 2FA
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 