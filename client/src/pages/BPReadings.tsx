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
  BarChart3
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts'

interface BPReading {
  _id: string
  systolic: number
  diastolic: number
  pulseRate?: number
  timestamp: string
  comments?: string
  category: 'normal' | 'elevated' | 'high-stage-1' | 'high-stage-2' | 'hypertensive-crisis'
  createdAt: string
}

const BP_CATEGORIES = {
  'normal': { label: 'Normal', color: 'bg-green-500', range: '<120 and <80' },
  'elevated': { label: 'Elevated', color: 'bg-yellow-500', range: '120-129 and <80' },
  'high-stage-1': { label: 'High Stage 1', color: 'bg-orange-500', range: '130-139 or 80-89' },
  'high-stage-2': { label: 'High Stage 2', color: 'bg-red-500', range: '140-179 or 90-119' },
  'hypertensive-crisis': { label: 'Hypertensive Crisis', color: 'bg-red-700', range: '>180 or >120' }
}

// Mock data - will be replaced with API calls
const mockReadings: BPReading[] = [
  {
    _id: '1',
    systolic: 120,
    diastolic: 80,
    pulseRate: 72,
    timestamp: '2024-01-28T08:30:00Z',
    comments: 'Morning reading, feeling good',
    category: 'normal',
    createdAt: '2024-01-28T08:30:00Z'
  },
  {
    _id: '2',
    systolic: 135,
    diastolic: 85,
    pulseRate: 78,
    timestamp: '2024-01-27T20:15:00Z',
    comments: 'Evening reading after dinner',
    category: 'high-stage-1',
    createdAt: '2024-01-27T20:15:00Z'
  },
  {
    _id: '3',
    systolic: 118,
    diastolic: 75,
    pulseRate: 68,
    timestamp: '2024-01-27T08:45:00Z',
    category: 'normal',
    createdAt: '2024-01-27T08:45:00Z'
  },
  {
    _id: '4',
    systolic: 125,
    diastolic: 82,
    pulseRate: 74,
    timestamp: '2024-01-26T09:00:00Z',
    category: 'elevated',
    createdAt: '2024-01-26T09:00:00Z'
  },
  {
    _id: '5',
    systolic: 115,
    diastolic: 70,
    pulseRate: 65,
    timestamp: '2024-01-25T08:30:00Z',
    category: 'normal',
    createdAt: '2024-01-25T08:30:00Z'
  },
  {
    _id: '6',
    systolic: 130,
    diastolic: 88,
    pulseRate: 76,
    timestamp: '2024-01-24T19:45:00Z',
    category: 'high-stage-1',
    createdAt: '2024-01-24T19:45:00Z'
  }
]

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

function AddBPReadingDialog({ onAdd }: { onAdd: (reading: Omit<BPReading, '_id' | 'createdAt'>) => void }) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    systolic: '',
    diastolic: '',
    pulseRate: '',
    comments: '',
    timestamp: new Date().toISOString().slice(0, 16)
  })
  const [errors, setErrors] = useState<string[]>([])

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

  const categorizeReading = (systolic: number, diastolic: number): BPReading['category'] => {
    if (systolic >= 180 || diastolic >= 120) return 'hypertensive-crisis'
    if (systolic >= 140 || diastolic >= 90) return 'high-stage-2'
    if (systolic >= 130 || diastolic >= 80) return 'high-stage-1'
    if (systolic >= 120 && diastolic < 80) return 'elevated'
    return 'normal'
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const systolic = parseInt(formData.systolic)
    const diastolic = parseInt(formData.diastolic)
    
    const newReading: Omit<BPReading, '_id' | 'createdAt'> = {
      systolic,
      diastolic,
      pulseRate: formData.pulseRate ? parseInt(formData.pulseRate) : undefined,
      timestamp: formData.timestamp,
      comments: formData.comments || undefined,
      category: categorizeReading(systolic, diastolic)
    }

    onAdd(newReading)
    setOpen(false)
    setFormData({
      systolic: '',
      diastolic: '',
      pulseRate: '',
      comments: '',
      timestamp: new Date().toISOString().slice(0, 16)
    })
    setErrors([])
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
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
              <label htmlFor="systolic" className="text-sm font-medium">
                Systolic (mmHg)
              </label>
              <Input
                id="systolic"
                type="number"
                placeholder="120"
                value={formData.systolic}
                onChange={(e) => setFormData({ ...formData, systolic: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="diastolic" className="text-sm font-medium">
                Diastolic (mmHg)
              </label>
              <Input
                id="diastolic"
                type="number"
                placeholder="80"
                value={formData.diastolic}
                onChange={(e) => setFormData({ ...formData, diastolic: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="pulseRate" className="text-sm font-medium">
              Pulse Rate (bpm) - Optional
            </label>
            <Input
              id="pulseRate"
              type="number"
              placeholder="72"
              value={formData.pulseRate}
              onChange={(e) => setFormData({ ...formData, pulseRate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="timestamp" className="text-sm font-medium">
              Date & Time
            </label>
            <Input
              id="timestamp"
              type="datetime-local"
              value={formData.timestamp}
              onChange={(e) => setFormData({ ...formData, timestamp: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="comments" className="text-sm font-medium">
              Comments - Optional
            </label>
            <Input
              id="comments"
              placeholder="e.g., after exercise, morning reading..."
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add Reading
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
    <Card className="dashboard-card hover:scale-[1.02] transition-transform">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-pink-500 text-white">
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
            <Badge className={`${category.color} text-white`}>
              {category.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(reading)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(reading._id)} className="text-red-600">
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
  const [readings, setReadings] = useState<BPReading[]>(mockReadings)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [loading, setLoading] = useState(false)

  const filteredReadings = readings.filter(reading => {
    const matchesSearch = reading.comments?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         `${reading.systolic}/${reading.diastolic}`.includes(searchQuery)
    const matchesCategory = filterCategory === 'all' || reading.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const handleAddReading = (newReading: Omit<BPReading, '_id' | 'createdAt'>) => {
    const reading: BPReading = {
      ...newReading,
      _id: Date.now().toString(),
      createdAt: new Date().toISOString()
    }
    setReadings([reading, ...readings])
  }

  const handleEditReading = (reading: BPReading) => {
    // TODO: Implement edit functionality
    console.log('Edit reading:', reading)
  }

  const handleDeleteReading = (id: string) => {
    setReadings(readings.filter(r => r._id !== id))
  }

  const averageBP = readings.length > 0 ? {
    systolic: Math.round(readings.reduce((sum, r) => sum + r.systolic, 0) / readings.length),
    diastolic: Math.round(readings.reduce((sum, r) => sum + r.diastolic, 0) / readings.length)
  } : null

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
        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Readings</CardTitle>
            <Heart className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readings.length}</div>
            <p className="text-xs text-muted-foreground">
              Recorded this month
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average BP</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {averageBP ? `${averageBP.systolic}/${averageBP.diastolic}` : '--/--'}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card className="dashboard-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Normal Readings</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categoryStats.find(s => s.count && readings.filter(r => r.category === 'normal').length)?.percentage.toFixed(0) || 0}%
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
          <TabsTrigger value="trend" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            BP Trends
          </TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trend">
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Blood Pressure Trends</CardTitle>
            </CardHeader>
            <CardContent>
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
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search readings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="all">All Categories</option>
          {Object.entries(BP_CATEGORIES).map(([key, category]) => (
            <option key={key} value={key}>{category.label}</option>
          ))}
        </select>
        <Button variant="outline" className="gap-2">
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