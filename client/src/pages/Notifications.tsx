import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Info,
  Calendar,
  Clock,
  Loader2,
  TestTube
} from 'lucide-react'
import notificationService, {
  type Notification,
  type NotificationStats,
  type GetNotificationsResponse
} from '@/services/notificationService'
import { formatDateIST, formatTimeIST } from '@/utils/timeUtils'

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [todayNotifications, setTodayNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<GetNotificationsResponse['pagination'] | null>(null)
  const [activeTab, setActiveTab] = useState('all')

  // Fetch notifications
  const fetchNotifications = async (page = 1, unreadOnly = false) => {
    try {
      const response = await notificationService.getNotifications(page, 20, unreadOnly)
      setNotifications(response.notifications)
      setPagination(response.pagination)
      setCurrentPage(page)
    } catch (error: any) {
      setError(error.message)
    }
  }

  // Fetch today's notifications
  const fetchTodayNotifications = async () => {
    try {
      const today = await notificationService.getTodayNotifications()
      setTodayNotifications(today)
    } catch (error: any) {
      setError(error.message)
    }
  }

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const statsData = await notificationService.getStats()
      setStats(statsData)
    } catch (error: any) {
      setError(error.message)
    }
  }

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError('')
      try {
        await Promise.all([
          fetchNotifications(1, false),
          fetchTodayNotifications(),
          fetchStats()
        ])
      } catch (error: any) {
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Handle tab change
  useEffect(() => {
    if (!loading) {
      if (activeTab === 'unread') {
        fetchNotifications(1, true)
      } else if (activeTab === 'all') {
        fetchNotifications(1, false)
      }
    }
  }, [activeTab])

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    setActionLoading(notificationId)
    try {
      await notificationService.markAsRead(notificationId)
      
      // Update local state
      setNotifications(prev => prev.map(n => 
        n._id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      ))
      setTodayNotifications(prev => prev.map(n => 
        n._id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      ))
      
      // Refresh stats
      await fetchStats()
      setSuccess('Notification marked as read')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setActionLoading(null)
    }
  }

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    setActionLoading('all')
    try {
      const result = await notificationService.markAllAsRead()
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })))
      setTodayNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })))
      
      // Refresh stats
      await fetchStats()
      setSuccess(`${result.modifiedCount} notifications marked as read`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setActionLoading(null)
    }
  }

  // Delete notification
  const handleDelete = async (notificationId: string) => {
    setActionLoading(notificationId)
    try {
      await notificationService.deleteNotification(notificationId)
      
      // Update local state
      setNotifications(prev => prev.filter(n => n._id !== notificationId))
      setTodayNotifications(prev => prev.filter(n => n._id !== notificationId))
      
      // Refresh stats
      await fetchStats()
      setSuccess('Notification deleted')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setActionLoading(null)
    }
  }

  // Create test notification
  const handleCreateTest = async () => {
    setActionLoading('test')
    try {
      await notificationService.createTestNotification()
      
      // Refresh data
      await Promise.all([
        fetchNotifications(currentPage, activeTab === 'unread'),
        fetchTodayNotifications(),
        fetchStats()
      ])
      
      setSuccess('Test notification created')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setActionLoading(null)
    }
  }

  // Refresh data
  const handleRefresh = async () => {
    setActionLoading('refresh')
    try {
      await Promise.all([
        fetchNotifications(currentPage, activeTab === 'unread'),
        fetchTodayNotifications(),
        fetchStats()
      ])
      setSuccess('Data refreshed')
      setTimeout(() => setSuccess(''), 3000)
    } catch (error: any) {
      setError(error.message)
    } finally {
      setActionLoading(null)
    }
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    fetchNotifications(page, activeTab === 'unread')
  }

  // Get notification icon
  const getNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case 'reminder':
        return notification.metadata.reminderType === 'morning' ? 
          <div className="text-orange-500">🌅</div> : 
          <div className="text-indigo-500">🌙</div>
      case 'alert':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'system':
        return <div className="text-purple-500">⚙️</div>
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-blue-100 text-blue-800',
      low: 'bg-gray-100 text-gray-800'
    }
    return colors[priority as keyof typeof colors] || colors.medium
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading notifications...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Manage your blood pressure reminders and alerts
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={actionLoading === 'refresh'}
          >
            {actionLoading === 'refresh' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button 
            variant="outline" 
            onClick={handleCreateTest}
            disabled={actionLoading === 'test'}
          >
            {actionLoading === 'test' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4" />
            )}
            Test
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <BellOff className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.unread}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Read</CardTitle>
              <CheckCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.read}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
          </TabsList>
          
          {stats && stats.unread > 0 && (
            <Button 
              variant="outline" 
              onClick={handleMarkAllAsRead}
              disabled={actionLoading === 'all'}
            >
              {actionLoading === 'all' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCheck className="h-4 w-4 mr-2" />
              )}
              Mark All Read
            </Button>
          )}
        </div>

        <TabsContent value="today" className="space-y-4">
          {todayNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No notifications for today</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            todayNotifications.map((notification) => (
              <Card key={notification._id} className={`${!notification.isRead ? 'border-blue-200 bg-blue-50/30' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className={`font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className={getPriorityBadge(notification.priority)}>
                              {notification.priority}
                            </Badge>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTimeIST(notification.scheduledFor)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {!notification.isRead && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMarkAsRead(notification._id)}
                              disabled={actionLoading === notification._id}
                            >
                              {actionLoading === notification._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(notification._id)}
                            disabled={actionLoading === notification._id}
                          >
                            {actionLoading === notification._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No notifications found</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {notifications.map((notification) => (
                <Card key={notification._id} className={`${!notification.isRead ? 'border-blue-200 bg-blue-50/30' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getNotificationIcon(notification)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className={`font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className={getPriorityBadge(notification.priority)}>
                                {notification.priority}
                              </Badge>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatDateIST(notification.scheduledFor)} {formatTimeIST(notification.scheduledFor)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {!notification.isRead && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleMarkAsRead(notification._id)}
                                disabled={actionLoading === notification._id}
                              >
                                {actionLoading === notification._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(notification._id)}
                              disabled={actionLoading === notification._id}
                            >
                              {actionLoading === notification._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalNotifications} total)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrev}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNext}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <CheckCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No unread notifications</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card key={notification._id} className="border-blue-200 bg-blue-50/30">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{notification.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className={getPriorityBadge(notification.priority)}>
                              {notification.priority}
                            </Badge>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDateIST(notification.scheduledFor)} {formatTimeIST(notification.scheduledFor)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(notification._id)}
                            disabled={actionLoading === notification._id}
                          >
                            {actionLoading === notification._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(notification._id)}
                            disabled={actionLoading === notification._id}
                          >
                            {actionLoading === notification._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}