import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5000/api/notifications',
  timeout: 10000,
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export interface Notification {
  _id: string
  userId: string
  title: string
  message: string
  type: 'reminder' | 'alert' | 'info' | 'system'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  scheduledFor: string
  isRead: boolean
  readAt?: string
  sentAt?: string
  status: 'pending' | 'sent' | 'delivered' | 'failed'
  metadata: {
    reminderType?: 'morning' | 'evening'
    recurring: boolean
    channel: 'app' | 'email' | 'both'
  }
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

export interface NotificationStats {
  total: number
  unread: number
  today: number
  read: number
}

export interface GetNotificationsResponse {
  notifications: Notification[]
  pagination: {
    currentPage: number
    totalPages: number
    totalNotifications: number
    hasNext: boolean
    hasPrev: boolean
  }
  unreadCount: number
}

class NotificationService {
  private api = api

  // Get user's notifications with pagination
  async getNotifications(page = 1, limit = 20, unreadOnly = false): Promise<GetNotificationsResponse> {
    try {
      const response = await this.api.get('/', {
        params: { page, limit, unreadOnly }
      })
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch notifications')
    }
  }

  // Get today's notifications
  async getTodayNotifications(): Promise<Notification[]> {
    try {
      const response = await this.api.get('/today')
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch today\'s notifications')
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<Notification> {
    try {
      const response = await this.api.patch(`/${notificationId}/read`)
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to mark notification as read')
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<{ modifiedCount: number }> {
    try {
      const response = await this.api.patch('/read-all')
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to mark all notifications as read')
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await this.api.delete(`/${notificationId}`)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete notification')
    }
  }

  // Get notification statistics
  async getStats(): Promise<NotificationStats> {
    try {
      const response = await this.api.get('/stats')
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch notification statistics')
    }
  }

  // Create test notification (for development)
  async createTestNotification(title?: string, message?: string, type?: string, priority?: string): Promise<Notification> {
    try {
      const response = await this.api.post('/test', {
        title,
        message,
        type,
        priority
      })
      return response.data.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create test notification')
    }
  }

  // Helper method to get notification color based on type and priority
  static getNotificationColor(notification: Notification): string {
    if (notification.priority === 'urgent') return 'text-red-600'
    if (notification.priority === 'high') return 'text-orange-600'
    
    switch (notification.type) {
      case 'alert':
        return 'text-red-500'
      case 'reminder':
        return 'text-blue-500'
      case 'system':
        return 'text-purple-500'
      case 'info':
      default:
        return 'text-gray-600'
    }
  }

  // Helper method to get notification icon based on type
  static getNotificationIcon(notification: Notification): string {
    switch (notification.type) {
      case 'reminder':
        return notification.metadata.reminderType === 'morning' ? '🌅' : '🌙'
      case 'alert':
        return '⚠️'
      case 'system':
        return '⚙️'
      case 'info':
      default:
        return 'ℹ️'
    }
  }

  // Helper method to format notification time
  static formatNotificationTime(notification: Notification): string {
    const date = new Date(notification.scheduledFor)
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return diffInMinutes === 0 ? 'Just now' : `${diffInMinutes} min ago`
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  // Helper method to check if notification is recent (within last 24 hours)
  static isRecentNotification(notification: Notification): boolean {
    const date = new Date(notification.scheduledFor)
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)
    return diffInHours <= 24
  }
}

const notificationService = new NotificationService()
export default notificationService