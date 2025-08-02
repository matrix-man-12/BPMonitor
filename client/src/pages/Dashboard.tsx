import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Heart, 
  Users, 
  TrendingUp, 
  Calendar,
  Plus,
  Activity,
  Clock,
  Target,
  ArrowRight,
  AlertTriangle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import bpReadingService, { type BPReading, type CreateBPReadingData } from '@/services/bpReadingService'
import familyService from '@/services/familyService'
import { 
  formatDateIST, 
  formatTimeIST, 
  getCurrentDatetimeLocal, 
  datetimeLocalToISO 
} from '@/utils/timeUtils'



function AddBPReadingDialog({ 
  children, 
  onAdd 
}: { 
  children?: React.ReactNode;
  onAdd: (reading: CreateBPReadingData) => void;
}) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    systolic: '',
    diastolic: '',
    pulseRate: '',
    timestamp: getCurrentDatetimeLocal(),
    comments: '',
    location: '',
    deviceUsed: '',
    tags: []
  })
  const [errors, setErrors] = useState<string[]>([])

  const validateForm = () => {
    const newErrors: string[] = []
    
    const systolic = parseInt(formData.systolic)
    const diastolic = parseInt(formData.diastolic)
    
    if (!systolic || systolic < 70 || systolic > 250) {
      newErrors.push('Systolic pressure must be between 70-250 mmHg')
    }
    
    if (!diastolic || diastolic < 40 || diastolic > 150) {
      newErrors.push('Diastolic pressure must be between 40-150 mmHg')
    }
    
    if (systolic <= diastolic) {
      newErrors.push('Systolic pressure must be higher than diastolic pressure')
    }
    
    if (formData.pulseRate && (parseInt(formData.pulseRate) < 30 || parseInt(formData.pulseRate) > 200)) {
      newErrors.push('Pulse rate must be between 30-200 bpm')
    }
    
    setErrors(newErrors)
    return newErrors.length === 0
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      const readingData: CreateBPReadingData = {
        systolic: parseInt(formData.systolic),
        diastolic: parseInt(formData.diastolic),
        pulseRate: formData.pulseRate ? parseInt(formData.pulseRate) : undefined,
        timestamp: formData.timestamp,
        comments: formData.comments || undefined,
        location: formData.location || undefined,
        deviceUsed: formData.deviceUsed || undefined,
        tags: formData.tags || []
      }
      
      await onAdd(readingData)
      setOpen(false)
      setFormData({
        systolic: '',
        diastolic: '',
        pulseRate: '',
        timestamp: getCurrentDatetimeLocal(),
        comments: '',
        location: '',
        deviceUsed: '',
        tags: []
      })
      setErrors([])
    } catch (error) {
      console.error('Error adding reading:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" className="gap-2 cursor-pointer">
            <Plus className="h-4 w-4" />
            Add Reading
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Blood Pressure Reading</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="systolic" className="text-sm font-medium cursor-pointer">
                Systolic (mmHg)
              </label>
              <Input
                id="systolic"
                type="number"
                placeholder="120"
                value={formData.systolic}
                onChange={(e) => setFormData({ ...formData, systolic: e.target.value })}
                className="cursor-pointer"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="diastolic" className="text-sm font-medium cursor-pointer">
                Diastolic (mmHg)
              </label>
              <Input
                id="diastolic"
                type="number"
                placeholder="80"
                value={formData.diastolic}
                onChange={(e) => setFormData({ ...formData, diastolic: e.target.value })}
                className="cursor-pointer"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="pulseRate" className="text-sm font-medium cursor-pointer">
              Pulse Rate (bpm) - Optional
            </label>
            <Input
              id="pulseRate"
              type="number"
              placeholder="72"
              value={formData.pulseRate}
              onChange={(e) => setFormData({ ...formData, pulseRate: e.target.value })}
              className="cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="timestamp" className="text-sm font-medium cursor-pointer">
              Date & Time
            </label>
            <Input
              id="timestamp"
              type="datetime-local"
              value={formData.timestamp}
              onChange={(e) => setFormData({ ...formData, timestamp: e.target.value })}
              className="cursor-pointer"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="comments" className="text-sm font-medium cursor-pointer">
              Comments - Optional
            </label>
            <Input
              id="comments"
              placeholder="e.g., after exercise, morning reading..."
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              className="cursor-pointer"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1 cursor-pointer">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 cursor-pointer">
              Add Reading
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const [recentReadings, setRecentReadings] = useState<BPReading[]>([])
  const [stats, setStats] = useState<any>(null)
  const [familyMembers, setFamilyMembers] = useState<any[]>([])
  const [loadingFamily, setLoadingFamily] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [recentData, statisticsData] = await Promise.all([
          bpReadingService.getRecentReadings(3),
          bpReadingService.getStatistics('30d')
        ])
        
        setRecentReadings(recentData)
        setStats(statisticsData)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      }
    }

    const fetchFamilyData = async () => {
      try {
        setLoadingFamily(true)
        const familyGroupsData = await familyService.getFamilyGroups()
        
        // Transform family groups data into display format
        const allMembers: any[] = []
        
        // Get current user ID from localStorage (stored when user logs in)
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
        const currentUserId = currentUser._id
        
        familyGroupsData.forEach(group => {
          group.members.forEach(member => {
            // Don't include the current user
            if (member.userId._id !== currentUserId) {
              allMembers.push({
                id: member.userId._id,
                name: `${member.userId.firstName} ${member.userId.lastName}`,
                role: member.role === 'admin' ? 'Admin' : 'Member',
                lastReading: 'No recent data',
                avatar: '',
                groupName: group.name
              })
            }
          })
        })
        
        setFamilyMembers(allMembers)
      } catch (error) {
        console.error('Failed to fetch family data:', error)
        setFamilyMembers([])
      } finally {
        setLoadingFamily(false)
      }
    }

    fetchDashboardData()
    fetchFamilyData()
  }, [])

  const progressPercentage = stats ? Math.min((stats.totalReadings / 7) * 100, 100) : 0

  const handleAddReading = async (newReading: CreateBPReadingData) => {
    try {
      // Convert timestamp to ISO for API
      const readingData = {
        ...newReading,
        timestamp: datetimeLocalToISO(newReading.timestamp || getCurrentDatetimeLocal())
      }
      
      await bpReadingService.createReading(readingData)
      
      // Refresh recent readings
      const recent = await bpReadingService.getRecentReadings()
      setRecentReadings(recent)
      
      // Refresh statistics
      const stats = await bpReadingService.getStatistics()
      setStats(stats)
      
      // Navigate to readings page
      navigate('/readings')
    } catch (error) {
      console.error('Error adding reading:', error)
    }
  }

  return (
    <div className="space-y-8">
      {/* Statistics Cards Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Readings Card */}
        <Card className="dashboard-card group hover:scale-105 cursor-pointer" onClick={() => navigate('/readings')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Readings
            </CardTitle>
            <Heart className="h-6 w-6 text-red-500 group-hover:animate-pulse cursor-pointer" />
          </CardHeader>
          <CardContent>
            <div className="stat-number text-red-500">{stats?.totalReadings || 0}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        {/* Family Members Card */}
        <Card className="dashboard-card group hover:scale-105 cursor-pointer" onClick={() => navigate('/family')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Family Members
            </CardTitle>
            <Users className="h-6 w-6 text-blue-500 group-hover:animate-bounce cursor-pointer" />
          </CardHeader>
          <CardContent>
            <div className="stat-number text-blue-500">{familyMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              Active in your group
            </p>
          </CardContent>
        </Card>

        {/* Average BP Card */}
        <Card className="dashboard-card group hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average BP
            </CardTitle>
            <Activity className="h-6 w-6 text-green-500 group-hover:animate-pulse cursor-pointer" />
          </CardHeader>
          <CardContent>
            <div className="stat-number text-green-500">
              {stats?.averageBP ? `${stats.averageBP.systolic}/${stats.averageBP.diastolic}` : '--/--'}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 7 days average
            </p>
          </CardContent>
        </Card>

        {/* Weekly Goal Card */}
        <Card className="dashboard-card group hover:scale-105 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Weekly Progress
            </CardTitle>
            <Target className="h-6 w-6 text-purple-500 group-hover:animate-spin cursor-pointer" />
          </CardHeader>
          <CardContent>
            <div className="stat-number text-purple-500">
              {stats?.totalReadings || 0}/7
            </div>
            <Progress value={progressPercentage} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {Math.round(progressPercentage)}% of weekly goal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Readings */}
        <Card className="dashboard-card lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold">Recent Readings</CardTitle>
              <AddBPReadingDialog onAdd={handleAddReading}>
                <Button size="sm" className="gap-2 cursor-pointer">
                <Plus className="h-4 w-4" />
                Add Reading
              </Button>
              </AddBPReadingDialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
              {recentReadings.map((reading) => (
              <div key={reading._id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-pink-500 text-white cursor-pointer">
                      <Heart className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-semibold text-lg">
                        {reading.systolic}/{reading.diastolic} mmHg
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                      {formatDateIST(reading.timestamp)} at {formatTimeIST(reading.timestamp)}
                    </div>
                    </div>
                  </div>
                  <Badge 
                  variant={reading.category === 'normal' ? 'default' : 'destructive'}
                  className="capitalize cursor-pointer"
                  >
                  {reading.category}
                  </Badge>
                </div>
              ))}
            {recentReadings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No readings yet. Start tracking your blood pressure!</p>
            </div>
            )}
            <Button 
              variant="outline" 
              className="w-full gap-2 cursor-pointer" 
              onClick={() => navigate('/readings')}
            >
              View All Readings
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Family Members Panel */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Family Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingFamily ? (
              <div className="text-center py-4 text-muted-foreground">
                Loading family members...
              </div>
            ) : familyMembers.length > 0 ? (
              familyMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                  <Avatar className="h-10 w-10 cursor-pointer">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white cursor-pointer">
                      {member.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{member.name}</div>
                    <div className="text-sm text-muted-foreground">{member.role}</div>
                    {member.groupName && (
                      <div className="text-xs text-muted-foreground">{member.groupName}</div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {member.lastReading}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No family members yet.</p>
                <p className="text-xs mt-1">Invite family members to start tracking together!</p>
              </div>
            )}
              
            <Button variant="outline" className="w-full mt-4 gap-2 cursor-pointer" onClick={() => navigate('/family')}>
              <Plus className="h-4 w-4" />
              Invite Family Member
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <AddBPReadingDialog onAdd={handleAddReading}>
              <Button 
                className="h-24 flex-col gap-2 bg-gradient-to-br from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 w-full cursor-pointer"
              >
              <Heart className="h-6 w-6" />
              Record BP Reading
            </Button>
            </AddBPReadingDialog>
            <Button 
              variant="outline" 
              className="h-24 flex-col gap-2 cursor-pointer"
              onClick={() => navigate('/family')}
            >
              <Users className="h-6 w-6" />
              Manage Family
            </Button>
            <Button 
              variant="outline" 
              className="h-24 flex-col gap-2 cursor-pointer"
              onClick={() => navigate('/readings')}
            >
              <TrendingUp className="h-6 w-6" />
              View Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 