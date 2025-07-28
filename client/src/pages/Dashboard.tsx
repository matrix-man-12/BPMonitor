import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { 
  Heart, 
  Users, 
  TrendingUp, 
  Calendar,
  Plus,
  Activity,
  Clock,
  Target
} from 'lucide-react'

// Mock data - will be replaced with real API data
const dashboardStats = {
  totalReadings: 156,
  familyMembers: 4,
  averageBP: { systolic: 125, diastolic: 80 },
  weeklyGoal: 7,
  completedReadings: 5
}

const recentReadings = [
  { id: 1, systolic: 120, diastolic: 80, date: '2024-01-27', time: '08:30 AM', status: 'normal' },
  { id: 2, systolic: 118, diastolic: 78, date: '2024-01-26', time: '08:15 AM', status: 'normal' },
  { id: 3, systolic: 135, diastolic: 85, date: '2024-01-25', time: '09:00 AM', status: 'elevated' },
]

const familyMembers = [
  { id: 1, name: 'John Doe', role: 'You', lastReading: '2 hours ago', avatar: '' },
  { id: 2, name: 'Jane Doe', role: 'Wife', lastReading: '1 day ago', avatar: '' },
  { id: 3, name: 'Mom', role: 'Mother', lastReading: '3 hours ago', avatar: '' },
]

export function Dashboard() {
  const progressPercentage = (dashboardStats.completedReadings / dashboardStats.weeklyGoal) * 100

  return (
    <div className="space-y-8">
      {/* Statistics Cards Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Readings Card */}
        <Card className="dashboard-card group hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Readings
            </CardTitle>
            <Heart className="h-6 w-6 text-red-500 group-hover:animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="stat-number text-red-500">{dashboardStats.totalReadings}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        {/* Family Members Card */}
        <Card className="dashboard-card group hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Family Members
            </CardTitle>
            <Users className="h-6 w-6 text-blue-500 group-hover:animate-bounce" />
          </CardHeader>
          <CardContent>
            <div className="stat-number text-blue-500">{dashboardStats.familyMembers}</div>
            <p className="text-xs text-muted-foreground">
              Active in your group
            </p>
          </CardContent>
        </Card>

        {/* Average BP Card */}
        <Card className="dashboard-card group hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average BP
            </CardTitle>
            <Activity className="h-6 w-6 text-green-500 group-hover:animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="stat-number text-green-500">
              {dashboardStats.averageBP.systolic}/{dashboardStats.averageBP.diastolic}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 7 days average
            </p>
          </CardContent>
        </Card>

        {/* Weekly Goal Card */}
        <Card className="dashboard-card group hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Weekly Progress
            </CardTitle>
            <Target className="h-6 w-6 text-purple-500 group-hover:animate-spin" />
          </CardHeader>
          <CardContent>
            <div className="stat-number text-purple-500">
              {dashboardStats.completedReadings}/{dashboardStats.weeklyGoal}
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
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Reading
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentReadings.map((reading) => (
              <div key={reading.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-pink-500 text-white">
                    <Heart className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold text-lg">
                      {reading.systolic}/{reading.diastolic} mmHg
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      {reading.date} at {reading.time}
                    </div>
                  </div>
                </div>
                <Badge 
                  variant={reading.status === 'normal' ? 'default' : 'destructive'}
                  className="capitalize"
                >
                  {reading.status}
                </Badge>
              </div>
            ))}
            {recentReadings.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No readings yet. Start tracking your blood pressure!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Family Members Panel */}
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Family Members</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {familyMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.avatar} alt={member.name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{member.name}</div>
                  <div className="text-sm text-muted-foreground">{member.role}</div>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {member.lastReading}
                </div>
              </div>
            ))}
            
            <Button variant="outline" className="w-full mt-4 gap-2">
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
            <Button className="h-24 flex-col gap-2 bg-gradient-to-br from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600">
              <Heart className="h-6 w-6" />
              Record BP Reading
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2">
              <Users className="h-6 w-6" />
              Manage Family
            </Button>
            <Button variant="outline" className="h-24 flex-col gap-2">
              <TrendingUp className="h-6 w-6" />
              View Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 