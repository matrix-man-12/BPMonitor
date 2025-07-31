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
  Loader2,
  Activity,
  Target,
  Zap,
  Info
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  ReferenceLine, 
  Area, 
  AreaChart,
  Brush,
  Dot,
  Tooltip,
  Legend
} from 'recharts'
import bpReadingService, { 
  type BPReading, 
  type CreateBPReadingData, 
  type BPStatistics, 
  type BPCategoryInfo 
} from '@/services/bpReadingService'
import {
  formatDateIST,
  formatTimeIST,
  formatChartDate,
  getCurrentDatetimeLocal,
  utcToDatetimeLocal,
  datetimeLocalToISO
} from '@/utils/timeUtils'

const BP_CATEGORIES = {
  'normal': { label: 'Normal', color: 'bg-green-500', range: '<120 and <80' },
  'elevated': { label: 'Elevated', color: 'bg-yellow-500', range: '120-129 and <80' },
  'high-stage-1': { label: 'High Stage 1', color: 'bg-orange-500', range: '130-139 or 80-89' },
  'high-stage-2': { label: 'High Stage 2', color: 'bg-red-500', range: '140-179 or 90-119' },
  'hypertensive-crisis': { label: 'Crisis', color: 'bg-red-700', range: '≥180 or ≥120' }
}

const chartConfig = {
  systolic: {
    label: "Systolic",
    color: "hsl(220 70% 50%)",
  },
  diastolic: {
    label: "Diastolic", 
    color: "hsl(160 60% 45%)",
  },
  pulse: {
    label: "Pulse Rate",
    color: "hsl(280 65% 60%)",
  },
  average: {
    label: "Average",
    color: "hsl(40 70% 50%)",
  }
} satisfies ChartConfig

// Custom tooltip component for better data display
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-background border rounded-lg p-2 sm:p-3 shadow-lg max-w-[200px] sm:max-w-[280px]">
        <p className="font-medium text-xs sm:text-sm mb-1 sm:mb-2 truncate">{label}</p>
        <div className="space-y-0.5 sm:space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-muted-foreground truncate">{entry.dataKey}:</span>
              <span className="font-medium flex-shrink-0">
                {entry.value} {entry.dataKey === 'pulse' ? 'bpm' : 'mmHg'}
              </span>
            </div>
          ))}
          {data.category && (
            <div className="pt-1 mt-1 border-t">
              <span className="text-xs text-muted-foreground">Category: </span>
              <Badge 
                variant="outline" 
                className={`text-xs ${BP_CATEGORIES[data.category as keyof typeof BP_CATEGORIES]?.color}`}
              >
                {BP_CATEGORIES[data.category as keyof typeof BP_CATEGORIES]?.label}
              </Badge>
            </div>
          )}
        </div>
      </div>
    )
  }
  return null
}

// Custom dot component for highlighting abnormal readings
const CustomDot = (props: any) => {
  const { cx, cy, payload } = props
  const isAbnormal = payload.category !== 'normal'
  
  if (isAbnormal) {
    return (
      <Dot
        cx={cx}
        cy={cy}
        r={6}
        fill="hsl(var(--destructive))"
        stroke="hsl(var(--background))"
        strokeWidth={2}
      />
    )
  }
  return <Dot cx={cx} cy={cy} r={3} fill={props.fill} />
}

function AddBPReadingDialog({ onAdd }: { onAdd: (reading: CreateBPReadingData) => void }) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<CreateBPReadingData>({
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
      const readingData: CreateBPReadingData = {
        systolic: parseInt(formData.systolic),
        diastolic: parseInt(formData.diastolic),
        pulseRate: formData.pulseRate ? parseInt(formData.pulseRate) : undefined,
        timestamp: datetimeLocalToISO(formData.timestamp),
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
                <ul className="list-disc pl-4">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Systolic (mmHg)</label>
              <Input
                type="number"
                min="70"
                max="250"
                value={formData.systolic}
                onChange={(e) => setFormData({...formData, systolic: e.target.value})}
                placeholder="120"
                className="cursor-pointer"
                disabled={submitting}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Diastolic (mmHg)</label>
              <Input
                type="number"
                min="40"
                max="150"
                value={formData.diastolic}
                onChange={(e) => setFormData({...formData, diastolic: e.target.value})}
                placeholder="80"
                className="cursor-pointer"
                disabled={submitting}
                required
              />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium">Pulse Rate (bpm) - Optional</label>
            <Input
              type="number"
              min="30"
              max="200"
              value={formData.pulseRate}
              onChange={(e) => setFormData({...formData, pulseRate: e.target.value})}
              placeholder="72"
              className="cursor-pointer"
              disabled={submitting}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Date & Time</label>
            <Input
              type="datetime-local"
              value={formData.timestamp}
              onChange={(e) => setFormData({...formData, timestamp: e.target.value})}
              className="cursor-pointer"
              disabled={submitting}
              required
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Comments - Optional</label>
            <Input
              value={formData.comments}
              onChange={(e) => setFormData({...formData, comments: e.target.value})}
              placeholder="How are you feeling?"
              className="cursor-pointer"
              disabled={submitting}
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={submitting} className="flex-1 cursor-pointer">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Reading'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting} className="cursor-pointer">
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function BPReadings() {
  const [readings, setReadings] = useState<BPReading[]>([])
  const [statistics, setStatistics] = useState<BPStatistics | null>(null)
  const [categories, setCategories] = useState<BPCategoryInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('30') // days
  const [showPulse, setShowPulse] = useState(false)
  const [showTrendlines, setShowTrendlines] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError('')
        
        try {
          // Fetch readings
          const readingsResult = await bpReadingService.getReadings()
          
          if (readingsResult && readingsResult.readings) {
            setReadings(readingsResult.readings)
          } else if (Array.isArray(readingsResult)) {
            setReadings(readingsResult)
          } else {
            setReadings([])
          }
        } catch (err) {
          setReadings([])
        }
        
        try {
          // Fetch statistics
          const statsResult = await bpReadingService.getStatistics()
          
          if (statsResult && typeof statsResult === 'object') {
            setStatistics(statsResult)
          }
        } catch (err) {
          // Statistics are optional, continue without them
        }
        
        try {
          // Fetch categories
          const categoriesResult = await bpReadingService.getCategories()
          
          if (categoriesResult && typeof categoriesResult === 'object') {
            const categoriesArray = Object.entries(categoriesResult).map(([key, value]: [string, any]) => ({
              id: key,
              ...value
            }))
            setCategories(categoriesArray)
          }
        } catch (err) {
          // Categories are optional, continue without them
        }
        
      } catch (err) {
        setError('Failed to load data: ' + (err instanceof Error ? err.message : 'Network error'))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAddReading = async (newReading: CreateBPReadingData) => {
    setSubmitting(true)
    try {
      const result = await bpReadingService.createReading(newReading)
      
      // Refresh readings data
      const readingsResult = await bpReadingService.getReadings()
      
      if (readingsResult && readingsResult.readings) {
        setReadings(readingsResult.readings)
      } else if (Array.isArray(readingsResult)) {
        setReadings(readingsResult)
      }
      
      // Try to refresh statistics
      try {
        const statsResult = await bpReadingService.getStatistics()
        if (statsResult) {
          setStatistics(statsResult)
        }
      } catch (err) {
        // Statistics refresh failed, continue
      }
      
    } catch (err) {
      setError('Failed to add reading: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteReading = async (id: string) => {
    try {
      const result = await bpReadingService.deleteReading(id)
      
      // Refresh readings data
      const readingsResult = await bpReadingService.getReadings()
      
      if (readingsResult && readingsResult.readings) {
        setReadings(readingsResult.readings)
      } else if (Array.isArray(readingsResult)) {
        setReadings(readingsResult)
      }
      
      // Try to refresh statistics
      try {
        const statsResult = await bpReadingService.getStatistics()
        if (statsResult) {
          setStatistics(statsResult)
        }
      } catch (err) {
        // Statistics refresh failed, continue
      }
      
    } catch (err) {
      setError('Failed to delete reading: ' + (err instanceof Error ? err.message : 'Unknown error'))
    }
  }

  // Filter readings by search query and time period
  const filteredReadings = readings
    .filter(reading => 
      searchQuery === '' || 
      reading.comments?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reading.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter(reading => {
      const days = parseInt(selectedPeriod)
      if (days === 0) return true // All time
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)
      return new Date(reading.timestamp) >= cutoff
    })

  const categoryStats = Object.entries(BP_CATEGORIES).map(([key, category]) => ({
    ...category,
    count: filteredReadings.filter(r => r.category === key).length,
    percentage: filteredReadings.length > 0 ? (filteredReadings.filter(r => r.category === key).length / filteredReadings.length) * 100 : 0
  }))

  // Enhanced chart data preparation with trend analysis
  const chartData = filteredReadings
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(reading => ({
      systolic: reading.systolic,
      diastolic: reading.diastolic,
      pulse: reading.pulseRate || 0,
      date: formatChartDate(reading.timestamp),
      fullDate: reading.timestamp,
      category: reading.category,
      // Add moving averages
      avgSystolic: 0, // Will be calculated below
      avgDiastolic: 0  // Will be calculated below
    }))

  // Calculate trend
  const getTrend = (data: number[]) => {
    if (data.length < 2) return 0
    const recent = data.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, data.length)
    const older = data.slice(0, -5).reduce((a, b) => a + b, 0) / Math.max(1, data.length - 5)
    return recent - older
  }

  const systolicTrend = chartData.length > 0 ? getTrend(chartData.map(d => d.systolic)) : 0
  const diastolicTrend = chartData.length > 0 ? getTrend(chartData.map(d => d.diastolic)) : 0

  // Safe number formatting helper
  const safeToFixed = (value: number | undefined | null, decimals: number = 1): string => {
    if (value === undefined || value === null || isNaN(value)) return '0'
    return value.toFixed(decimals)
  }

  // Safe percentage calculation
  const calculatePercentage = (part: number, total: number): string => {
    if (total === 0) return '0'
    return ((part / total) * 100).toFixed(1)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <div className="text-center">
            <p className="font-medium">Loading BP readings...</p>
            <p className="text-sm text-muted-foreground">Connecting to backend database</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Heart className="h-8 w-8 text-red-500" />
            Blood Pressure Readings
          </h1>
          <p className="text-muted-foreground">
            Track and monitor your blood pressure over time
          </p>
        </div>
        <AddBPReadingDialog onAdd={handleAddReading} />
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Error loading data:</div>
              <div className="text-sm">{error}</div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Show message if no data */}
      {!loading && !error && readings.length === 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-8 text-center">
            <Heart className="h-16 w-16 mx-auto mb-4 text-blue-500 opacity-50" />
            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
              No BP Readings Yet
            </h3>
            <p className="text-blue-600 dark:text-blue-300 mb-4">
              Get started by adding your first blood pressure reading using the "Add Reading" button above.
            </p>
            <AddBPReadingDialog onAdd={handleAddReading}>
              <Button className="cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Reading
              </Button>
            </AddBPReadingDialog>
          </CardContent>
        </Card>
      )}

      {/* Rest of the component remains the same when there is data */}
      {readings.length > 0 && (
        <>
          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="dashboard-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Readings</p>
                    <p className="text-2xl font-bold">{statistics?.totalReadings || readings.length}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="dashboard-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Average BP</p>
                    <p className="text-2xl font-bold">
                      {statistics && statistics.averageSystolic && statistics.averageDiastolic ? 
                        `${Math.round(statistics.averageSystolic)}/${Math.round(statistics.averageDiastolic)}` : 
                       readings.length > 0 ? 
                        `${Math.round(readings.reduce((sum, r) => sum + r.systolic, 0) / readings.length)}/${Math.round(readings.reduce((sum, r) => sum + r.diastolic, 0) / readings.length)}` : 
                        '--/--'}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-green-500" />
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {systolicTrend > 0 ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : systolicTrend < 0 ? (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  ) : null}
                  <span className="text-xs text-muted-foreground">
                    {safeToFixed(Math.abs(systolicTrend), 1)} mmHg trend
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="dashboard-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Normal Readings</p>
                    <p className="text-2xl font-bold">
                      {statistics && typeof statistics.normalPercentage === 'number' ? 
                        `${safeToFixed(statistics.normalPercentage, 0)}%` : 
                       readings.length > 0 ? 
                        `${calculatePercentage(readings.filter(r => r.category === 'normal').length, readings.length)}%` :
                        '0%'}
                    </p>
                  </div>
                  <Heart className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="dashboard-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Latest Reading</p>
                    <p className="text-2xl font-bold">
                      {readings.length > 0 ? `${readings[0].systolic}/${readings[0].diastolic}` : '--/--'}
                    </p>
                  </div>
                  <Zap className="h-8 w-8 text-purple-500" />
                </div>
                {readings.length > 0 && (
                  <Badge 
                    variant="outline" 
                    className={`mt-2 ${BP_CATEGORIES[readings[0].category as keyof typeof BP_CATEGORIES]?.color} text-white`}
                  >
                    {BP_CATEGORIES[readings[0].category as keyof typeof BP_CATEGORIES]?.label}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Charts Section */}
          <Tabs defaultValue="trend" className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <TabsList>
                <TabsTrigger value="trend" className="gap-2 cursor-pointer">
                  <BarChart3 className="h-4 w-4" />
                  BP Trends
                </TabsTrigger>
                <TabsTrigger value="distribution" className="cursor-pointer">Distribution</TabsTrigger>
              </TabsList>
              
              {/* Chart Controls */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-1 text-sm border rounded-md cursor-pointer"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 3 months</option>
                  <option value="0">All time</option>
                </select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPulse(!showPulse)}
                  className="cursor-pointer"
                >
                  {showPulse ? 'Hide' : 'Show'} Pulse
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTrendlines(!showTrendlines)}
                  className="cursor-pointer"
                >
                  {showTrendlines ? 'Hide' : 'Show'} Trends
                </Button>
              </div>
            </div>
            
            <TabsContent value="trend">
              <Card className="dashboard-card">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      Blood Pressure Trends
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span>Systolic</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>Diastolic</span>
                      </div>
                      {showPulse && (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                          <span>Pulse</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Chart Controls */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="px-3 py-2 text-xs sm:text-sm border rounded-md cursor-pointer bg-background min-w-0 flex-shrink-0"
                    >
                      <option value="7">Last 7 days</option>
                      <option value="30">Last 30 days</option>
                      <option value="90">Last 3 months</option>
                      <option value="0">All time</option>
                    </select>
                    
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPulse(!showPulse)}
                        className="cursor-pointer text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-auto min-w-0 flex-shrink-0"
                      >
                        {showPulse ? 'Hide' : 'Show'} Pulse
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTrendlines(!showTrendlines)}
                        className="cursor-pointer text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-auto min-w-0 flex-shrink-0"
                      >
                        {showTrendlines ? 'Hide' : 'Show'} Trends
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <div className="space-y-3">
                      <ChartContainer 
                        config={chartConfig} 
                        className="h-[250px] sm:h-[280px] md:h-[320px] lg:h-[350px] w-full"
                      >
                        <LineChart
                          accessibilityLayer
                          data={chartData}
                          margin={{
                            left: 8,
                            right: 8,
                            top: 16,
                            bottom: chartData.length > 10 ? 60 : 16,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                          <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            fontSize={10}
                            interval="preserveStartEnd"
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            className="text-xs sm:text-sm"
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            fontSize={10}
                            width={35}
                            domain={['dataMin - 10', 'dataMax + 10']}
                            className="text-xs sm:text-sm"
                          />
                          <ChartTooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            content={<CustomTooltip />}
                            wrapperStyle={{ 
                              maxWidth: '280px',
                              fontSize: '12px'
                            }}
                          />
                          
                          {/* Reference lines for normal ranges */}
                          <ReferenceLine y={120} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeWidth={1} />
                          <ReferenceLine y={80} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeWidth={1} />
                          <ReferenceLine y={140} stroke="hsl(var(--destructive))" strokeDasharray="3 3" strokeWidth={1} opacity={0.5} />
                          <ReferenceLine y={90} stroke="hsl(var(--destructive))" strokeDasharray="3 3" strokeWidth={1} opacity={0.5} />
                          
                          {/* Moving average trend lines */}
                          {showTrendlines && (
                            <>
                              <Line
                                dataKey="avgSystolic"
                                type="monotone"
                                stroke="hsl(220 70% 50%)"
                                strokeWidth={1}
                                strokeDasharray="5 5"
                                dot={false}
                                opacity={0.6}
                              />
                              <Line
                                dataKey="avgDiastolic"
                                type="monotone"
                                stroke="hsl(160 60% 45%)"
                                strokeWidth={1}
                                strokeDasharray="5 5"
                                dot={false}
                                opacity={0.6}
                              />
                            </>
                          )}
                          
                          {/* Main BP lines */}
                          <Line
                            dataKey="systolic"
                            type="monotone"
                            stroke="hsl(220 70% 50%)"
                            strokeWidth={3}
                            dot={<CustomDot />}
                            activeDot={{ r: 6, stroke: 'hsl(220 70% 50%)', strokeWidth: 2 }}
                          />
                          <Line
                            dataKey="diastolic"
                            type="monotone"
                            stroke="hsl(160 60% 45%)"
                            strokeWidth={3}
                            dot={<CustomDot />}
                            activeDot={{ r: 6, stroke: 'hsl(160 60% 45%)', strokeWidth: 2 }}
                          />
                          
                          {/* Pulse line */}
                          {showPulse && (
                            <Line
                              dataKey="pulse"
                              type="monotone"
                              stroke="hsl(280 65% 60%)"
                              strokeWidth={2}
                              dot={{ r: 3 }}
                              activeDot={{ r: 5, stroke: 'hsl(280 65% 60%)', strokeWidth: 2 }}
                            />
                          )}
                          
                          {/* Brush for time selection */}
                          {chartData.length > 10 && (
                            <Brush
                              dataKey="date"
                              height={25}
                              stroke="hsl(var(--primary))"
                              fill="hsl(var(--muted))"
                              className="text-xs"
                            />
                          )}
                        </LineChart>
                      </ChartContainer>
                      
                      {/* Trend Analysis */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-3 border-t">
                        <div className="space-y-3">
                          <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
                            <TrendingUp className="h-4 w-4" />
                            Trend Analysis
                          </h4>
                          <div className="text-xs sm:text-sm space-y-2">
                            <div className="flex justify-between items-center">
                              <span>Systolic trend:</span>
                              <span className={`font-medium ${systolicTrend > 2 ? 'text-red-500' : systolicTrend < -2 ? 'text-green-500' : 'text-muted-foreground'}`}>
                                {systolicTrend > 0 ? '+' : ''}{safeToFixed(systolicTrend, 1)} mmHg
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Diastolic trend:</span>
                              <span className={`font-medium ${diastolicTrend > 2 ? 'text-red-500' : diastolicTrend < -2 ? 'text-green-500' : 'text-muted-foreground'}`}>
                                {diastolicTrend > 0 ? '+' : ''}{safeToFixed(diastolicTrend, 1)} mmHg
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
                            <Target className="h-4 w-4" />
                            Target Ranges
                          </h4>
                          <div className="text-xs sm:text-sm space-y-2 text-muted-foreground">
                            <div className="flex justify-between items-center">
                              <span>Normal:</span>
                              <span>&lt;120/80 mmHg</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Elevated:</span>
                              <span>120-129/&lt;80 mmHg</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>High:</span>
                              <span>≥130/≥80 mmHg</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg mb-2">No data available for chart</p>
                      <p className="text-sm">Add your first BP reading to see trends and patterns</p>
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
                        <span className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${stat.color}`}></div>
                          {stat.label}
                        </span>
                        <span className="font-medium">
                          {stat.count} readings ({safeToFixed(stat.percentage, 1)}%)
                        </span>
                      </div>
                      <Progress value={stat.percentage} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        Range: {stat.range}
                      </div>
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
              className="px-4 py-2 border rounded-md cursor-pointer"
              onChange={(e) => {
                // Handle filter by category
              }}
            >
              <option value="">All Categories</option>
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
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Recent Readings ({filteredReadings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredReadings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No readings match your search criteria</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReadings.slice(0, 10).map((reading) => (
                    <div key={reading._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-lg font-semibold">{reading.systolic}/{reading.diastolic}</div>
                              <Badge variant="outline" className={bpReadingService.getCategoryColor(reading.category)}>
                                {reading.category}
                              </Badge>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              <div>{formatDateIST(reading.timestamp)}</div>
                              <div>{formatTimeIST(reading.timestamp)}</div>
                            </div>
                          </div>
                          
                          {reading.comments && (
                            <p className="text-sm text-muted-foreground">{reading.comments}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={`${BP_CATEGORIES[reading.category as keyof typeof BP_CATEGORIES]?.color} text-white`}
                        >
                          {BP_CATEGORIES[reading.category as keyof typeof BP_CATEGORIES]?.label}
                        </Badge>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="cursor-pointer">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem className="cursor-pointer">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="cursor-pointer text-red-600"
                              onClick={() => handleDeleteReading(reading._id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                  
                  {filteredReadings.length > 10 && (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>Showing 10 of {filteredReadings.length} readings</p>
                      <Button variant="outline" size="sm" className="mt-2 cursor-pointer">
                        Load More
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
} 