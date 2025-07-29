import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { 
  Heart, 
  Plus, 
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  AlertTriangle,
  BarChart3,
  Loader2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts'
import bpReadingService, { 
  type BPReading, 
  type CreateBPReadingData, 
  type BPStatistics, 
  type BPCategoryInfo 
} from '@/services/bpReadingService'

const BP_CATEGORIES = {
  'normal': { label: 'Normal', color: 'bg-green-500', range: '<120 and <80' },
  'elevated': { label: 'Elevated', color: 'bg-yellow-500', range: '120-129 and <80' },
  'high-stage-1': { label: 'High Stage 1', color: 'bg-orange-500', range: '130-139 or 80-89' },
  'high-stage-2': { label: 'High Stage 2', color: 'bg-red-500', range: '140-179 or 90-119' },
  'hypertensive-crisis': { label: 'Hypertensive Crisis', color: 'bg-red-700', range: '>180 or >120' }
}

const chartConfig = {
  systolic: {
    label: "Systolic",
    color: "hsl(var(--chart-1))",
  },
  diastolic: {
    label: "Diastolic", 
    color: "hsl(var(--chart-2))",
  },
  pulse: {
    label: "Pulse Rate",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

function AddBPReadingDialog({ onAdd }: { onAdd: (reading: CreateBPReadingData) => void }) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    systolic: '',
    diastolic: '',
    pulseRate: '',
    comments: '',
    timestamp: new Date().toISOString().slice(0, 16)
  })
  const [errors, setErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const validateForm = () => {
    const newErrors: string[] = []
    
    if (!formData.systolic || parseInt(formData.systolic) < 70 || parseInt(formData.systolic) > 250) {
      newErrors.push('Systolic pressure must be between 70-250 mmHg')
    }
    
    if (!formData.diastolic || parseInt(formData.diastolic) < 40 || parseInt(formData.diastolic) > 150) {
      newErrors.push('Diastolic pressure must be between 40-150 mmHg')
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

    setSubmitting(true)
    
    try {
      const systolic = parseInt(formData.systolic)
      const diastolic = parseInt(formData.diastolic)
      
      const newReading: CreateBPReadingData = {
        systolic,
        diastolic,
        pulseRate: formData.pulseRate ? parseInt(formData.pulseRate) : undefined,
        timestamp: formData.timestamp,
        comments: formData.comments || undefined
      }

      await onAdd(newReading)
      setOpen(false)
      setFormData({
        systolic: '',
        diastolic: '',
        pulseRate: '',
        comments: '',
        timestamp: new Date().toISOString().slice(0, 16)
      })
      setErrors([])
    } catch (error) {
      console.error('Error adding reading:', error)
      setErrors(['Failed to add reading. Please try again.'])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          Add Reading
        </Button>
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
                disabled={submitting}
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
                disabled={submitting}
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
              disabled={submitting}
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
              disabled={submitting}
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
              disabled={submitting}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)} 
              className="flex-1 cursor-pointer"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 cursor-pointer" 
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Reading'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function BPReadingCard({ reading, onEdit, onDelete }: { 
  reading: BPReading
  onEdit: (reading: BPReading) => void
  onDelete: (id: string) => void 
}) {
  const category = BP_CATEGORIES[reading.category]
  const readingDate = new Date(reading.timestamp)

  return (
    <Card className="dashboard-card hover:scale-[1.02] transition-transform cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-pink-500 text-white cursor-pointer">
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {reading.systolic}/{reading.diastolic}
                <span className="text-sm font-normal text-muted-foreground ml-1">mmHg</span>
              </div>
              {reading.pulseRate && (
                <div className="text-sm text-muted-foreground">
                  Pulse: {reading.pulseRate} bpm
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={`${category.color} text-white cursor-pointer`}>
              {category.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="cursor-pointer">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(reading)} className="cursor-pointer">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(reading._id)} className="text-red-600 cursor-pointer">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            {readingDate.toLocaleDateString()}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            {readingDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        
        {reading.comments && (
          <div className="mt-2 text-sm text-muted-foreground">
            "{reading.comments}"
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function BPReadings() {
  const [readings, setReadings] = useState<BPReading[]>([])
  const [statistics, setStatistics] = useState<BPStatistics | null>(null)
  const [categories, setCategories] = useState<Record<string, BPCategoryInfo>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const [readingsData, statisticsData, categoriesData] = await Promise.all([
          bpReadingService.getReadings({ limit: 50, sortBy: 'timestamp', sortOrder: 'desc' }),
          bpReadingService.getStatistics('30d'),
          bpReadingService.getCategories()
        ])
        
        setReadings(readingsData.readings)
        setStatistics(statisticsData)
        setCategories(categoriesData)
      } catch (error) {
        console.error('Failed to fetch BP data:', error)
        setError('Failed to load BP readings. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredReadings = readings.filter(reading => {
    const matchesSearch = reading.comments?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         `${reading.systolic}/${reading.diastolic}`.includes(searchQuery)
    const matchesCategory = filterCategory === 'all' || reading.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const handleAddReading = async (newReading: CreateBPReadingData) => {
    try {
      const savedReading = await bpReadingService.createReading(newReading)
      setReadings([savedReading, ...readings])
      
      // Refresh statistics
      const updatedStats = await bpReadingService.getStatistics('30d')
      setStatistics(updatedStats)
    } catch (error) {
      console.error('Failed to add reading:', error)
      throw error // Re-throw to be handled by the dialog
    }
  }

  const handleEditReading = async (reading: BPReading) => {
    // TODO: Implement edit functionality with a dialog
    console.log('Edit reading:', reading)
  }

  const handleDeleteReading = async (id: string) => {
    try {
      await bpReadingService.deleteReading(id)
      setReadings(readings.filter(r => r._id !== id))
      
      // Refresh statistics
      const updatedStats = await bpReadingService.getStatistics('30d')
      setStatistics(updatedStats)
    } catch (error) {
      console.error('Failed to delete reading:', error)
      // TODO: Show error message to user
    }
  }

  // Calculate category stats from current readings
  const categoryStats = Object.entries(BP_CATEGORIES).map(([key, category]) => ({
    ...category,
    count: readings.filter(r => r.category === key).length,
    percentage: readings.length > 0 ? (readings.filter(r => r.category === key).length / readings.length) * 100 : 0
  }))

  // Prepare chart data
  const chartData = readings
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(reading => ({
      date: new Date(reading.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      systolic: reading.systolic,
      diastolic: reading.diastolic,
      pulse: reading.pulseRate || 0,
      fullDate: reading.timestamp
    }))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading BP readings...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Blood Pressure Readings</h1>
          <p className="text-muted-foreground">Track and monitor your blood pressure over time</p>
        </div>
        <AddBPReadingDialog onAdd={handleAddReading} />
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="dashboard-card cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Readings</CardTitle>
            <Heart className="h-4 w-4 text-red-500 cursor-pointer" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.totalReadings || 0}</div>
            <p className="text-xs text-muted-foreground">
              Recorded this month
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average BP</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500 cursor-pointer" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.averageBP ? `${statistics.averageBP.systolic}/${statistics.averageBP.diastolic}` : '--/--'}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Normal Readings</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-500 cursor-pointer" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics?.categoryDistribution?.normal?.percentage || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Within normal range
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="trend" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trend" className="gap-2 cursor-pointer">
            <BarChart3 className="h-4 w-4" />
            BP Trends
          </TabsTrigger>
          <TabsTrigger value="distribution" className="cursor-pointer">Distribution</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trend">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Blood Pressure Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ChartContainer config={chartConfig}>
                  <LineChart
                    accessibilityLayer
                    data={chartData}
                    margin={{
                      left: 12,
                      right: 12,
                    }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      domain={[60, 160]}
                    />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <ReferenceLine y={120} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                    <ReferenceLine y={80} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                    <Line
                      dataKey="systolic"
                      type="monotone"
                      stroke="var(--color-systolic)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      dataKey="diastolic"
                      type="monotone"
                      stroke="var(--color-diastolic)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No data available for chart</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="distribution">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Reading Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryStats.map((stat) => (
                <div key={stat.label} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{stat.label}</span>
                    <span>{stat.count} readings ({stat.percentage.toFixed(0)}%)</span>
                  </div>
                  <Progress value={stat.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground cursor-pointer" />
          <Input
            placeholder="Search readings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 cursor-pointer"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background cursor-pointer"
        >
          <option value="all">All Categories</option>
          {Object.entries(BP_CATEGORIES).map(([key, category]) => (
            <option key={key} value={key}>{category.label}</option>
          ))}
        </select>
        <Button variant="outline" className="gap-2 cursor-pointer">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Readings List */}
      <div className="space-y-4">
        {filteredReadings.length === 0 ? (
          <Card className="dashboard-card">
            <CardContent className="text-center py-8">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No readings found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || filterCategory !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Start tracking your blood pressure by adding your first reading'
                }
              </p>
              {!searchQuery && filterCategory === 'all' && (
                <AddBPReadingDialog onAdd={handleAddReading} />
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredReadings.map((reading) => (
              <BPReadingCard
                key={reading._id}
                reading={reading}
                onEdit={handleEditReading}
                onDelete={handleDeleteReading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 