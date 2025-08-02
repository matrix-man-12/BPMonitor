import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import notificationService, { type NotificationStats } from '@/services/notificationService'

interface NotificationContextType {
  stats: NotificationStats | null
  unreadCount: number
  loading: boolean
  error: string | null
  refreshStats: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setError(null)
      const statsData = await notificationService.getStats()
      setStats(statsData)
    } catch (error: any) {
      setError(error.message)
      console.error('Error fetching notification stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const refreshStats = async () => {
    await fetchStats()
  }

  useEffect(() => {
    // Initial fetch
    fetchStats()

    // Set up periodic refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000)

    return () => clearInterval(interval)
  }, [])

  const value: NotificationContextType = {
    stats,
    unreadCount: stats?.unread || 0,
    loading,
    error,
    refreshStats
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}