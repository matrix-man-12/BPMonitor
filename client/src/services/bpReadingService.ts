import axios from 'axios'
import { getCurrentIST } from '@/utils/timeUtils'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const api = axios.create({
  baseURL: `${API_URL}/api/bp-readings`
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface BPReading {
  _id: string
  userId: string
  systolic: number
  diastolic: number
  pulseRate?: number
  timestamp: string
  comments?: string
  category: 'very-low' | 'low' | 'normal' | 'elevated' | 'high-stage-1' | 'high-stage-2' | 'hypertensive-crisis'
  location?: string
  deviceUsed?: string
  isValidated: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
  bpDisplay: string
  formattedDate: string
  formattedTime: string
}

export interface CreateBPReadingData {
  systolic: number
  diastolic: number
  pulseRate?: number
  timestamp?: string
  comments?: string
  location?: string
  deviceUsed?: string
  tags?: string[]
}

export interface UpdateBPReadingData extends Partial<CreateBPReadingData> {}

export interface BPReadingsResponse {
  readings: BPReading[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface BPStatistics {
  totalReadings: number
  averageBP: {
    systolic: number
    diastolic: number
    pulse: number | null
  } | null
  categoryDistribution: Record<string, {
    count: number
    percentage: number
  }>
  trends: Array<{
    date: string
    avgSystolic: number
    avgDiastolic: number
    avgPulse: number | null
    readingCount: number
  }>
  period: string
  dateRange: {
    startDate: string
    endDate: string
  }
}

export interface BPCategoryInfo {
  label: string
  color: string
  range: string
  description: string
}

export interface GetBPReadingsParams {
  page?: number
  limit?: number
  category?: string
  startDate?: string
  endDate?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

class BPReadingService {
  private api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  constructor() {
    // Add request interceptor to include JWT token
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })
  }

  // Create a new BP reading
  async createReading(data: CreateBPReadingData): Promise<BPReading> {
    try {
      const response = await api.post('/', data)
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create BP reading')
    }
  }

  // Get all BP readings with optional filters
  async getReadings(params: GetBPReadingsParams = {}): Promise<BPReadingsResponse> {
    try {
      const response = await api.get('/', { params })
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch BP readings')
    }
  }

  // Get a single BP reading by ID
  async getReadingById(id: string): Promise<BPReading> {
    try {
      const response = await api.get(`/${id}`)
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch BP reading')
    }
  }

  // Update a BP reading
  async updateReading(id: string, data: UpdateBPReadingData): Promise<BPReading> {
    try {
      const response = await api.put(`/${id}`, data)
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update BP reading')
    }
  }

  // Delete a BP reading
  async deleteReading(id: string): Promise<void> {
    try {
      await api.delete(`/${id}`)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete BP reading')
    }
  }

  // Get recent BP readings
  async getRecentReadings(limit: number = 5): Promise<BPReading[]> {
    try {
      const response = await api.get('/recent', { params: { limit } })
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch recent readings')
    }
  }

  // Get BP reading statistics
  async getStatistics(period: string = '30d'): Promise<BPStatistics> {
    try {
      const response = await api.get('/statistics', { params: { period } })
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch statistics')
    }
  }

  // Get BP category information
  async getCategories(): Promise<Record<string, BPCategoryInfo>> {
    try {
      const response = await api.get('/categories')
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch categories')
    }
  }

  // Helper method to categorize BP reading
  static categorizeBP(systolic: number, diastolic: number): BPReading['category'] {
    if (systolic >= 180 || diastolic >= 120) {
      return 'hypertensive-crisis'
    } else if (systolic >= 140 || diastolic >= 90) {
      return 'high-stage-2'
    } else if (systolic >= 130 || diastolic >= 80) {
      return 'high-stage-1'
    } else if (systolic >= 120 && diastolic < 80) {
      return 'elevated'
    } else if (systolic >= 90 && diastolic >= 60) {
      return 'normal'
    } else if (systolic >= 80 && diastolic >= 50) {
      return 'low'
    } else {
      return 'very-low'
    }
  }

  // Helper method to get category color
  static getCategoryColor(category: BPReading['category']): string {
    const colors = {
      'very-low': '#7c3aed',
      'low': '#a855f7',
      'normal': '#22c55e',
      'elevated': '#eab308',
      'high-stage-1': '#f97316',
      'high-stage-2': '#ef4444',
      'hypertensive-crisis': '#dc2626'
    }
    return colors[category] || '#6b7280'
  }

  // Helper method to format BP reading for display
  static formatBPReading(reading: BPReading): string {
    return `${reading.systolic}/${reading.diastolic}`
  }

  // Helper method to validate BP reading data
  static validateBPData(data: CreateBPReadingData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate systolic pressure
    if (!data.systolic || data.systolic < 70 || data.systolic > 250) {
      errors.push('Systolic pressure must be between 70-250 mmHg')
    }

    // Validate diastolic pressure
    if (!data.diastolic || data.diastolic < 40 || data.diastolic > 150) {
      errors.push('Diastolic pressure must be between 40-150 mmHg')
    }

    // Validate systolic > diastolic
    if (data.systolic && data.diastolic && data.systolic <= data.diastolic) {
      errors.push('Systolic pressure must be higher than diastolic pressure')
    }

    // Validate pulse rate
    if (data.pulseRate && (data.pulseRate < 30 || data.pulseRate > 200)) {
      errors.push('Pulse rate must be between 30-200 bpm')
    }

    // Validate timestamp (check if in future - using IST)
    if (data.timestamp) {
      const inputDate = new Date(data.timestamp)
      const currentIST = getCurrentIST()
      if (inputDate > currentIST) {
        errors.push('Reading timestamp cannot be in the future')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

export { BPReadingService }
export default new BPReadingService() 