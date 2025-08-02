# Notification System Documentation

## Overview
The BP Monitor notification system sends automated blood pressure reminders to users at scheduled times and provides a comprehensive notification management interface.

## Features

### 🕒 Scheduled Notifications
- **Morning Reminders**: 7:00 AM IST daily
- **Evening Reminders**: 10:00 PM IST daily
- **Automatic Cleanup**: Old notifications removed after 24 hours

### 📱 Notification Management
- View all notifications with pagination
- Filter by read/unread status
- Today's notifications view
- Mark individual or all notifications as read
- Delete notifications
- Real-time notification count in sidebar

### 🔧 API Endpoints

#### GET `/api/notifications`
Get user's notifications with pagination
- **Query Parameters**: `page`, `limit`, `unreadOnly`
- **Response**: Paginated notifications with stats

#### GET `/api/notifications/today`
Get today's notifications for user

#### GET `/api/notifications/stats`
Get notification statistics (total, unread, today, read)

#### PATCH `/api/notifications/:id/read`
Mark specific notification as read

#### PATCH `/api/notifications/read-all`
Mark all notifications as read

#### DELETE `/api/notifications/:id`
Delete specific notification

#### POST `/api/notifications/test`
Create test notification (development only)

## Database Schema

### Notification Model
```javascript
{
  userId: ObjectId,           // Reference to User
  title: String,              // Notification title
  message: String,            // Notification message
  type: String,               // 'reminder', 'alert', 'info', 'system'
  priority: String,           // 'low', 'medium', 'high', 'urgent'
  scheduledFor: Date,         // When notification should be shown
  isRead: Boolean,            // Read status
  readAt: Date,               // When marked as read
  sentAt: Date,               // When notification was sent
  status: String,             // 'pending', 'sent', 'delivered', 'failed'
  metadata: {
    reminderType: String,     // 'morning', 'evening'
    recurring: Boolean,       // If notification repeats
    channel: String           // 'app', 'email', 'both'
  },
  errorMessage: String,       // Error details if failed
  createdAt: Date,            // Auto-generated
  updatedAt: Date             // Auto-generated
}
```

### Indexes
- `{ userId: 1, scheduledFor: -1 }` - User notifications by date
- `{ userId: 1, isRead: 1 }` - User read/unread notifications
- `{ status: 1, scheduledFor: 1 }` - Pending notifications processing
- `{ createdAt: 1 }` - TTL index for automatic cleanup (24 hours)

## Scheduler Configuration

### Cron Jobs
```javascript
// Morning reminders at 7:00 AM IST
'0 7 * * *'

// Evening reminders at 10:00 PM IST  
'0 22 * * *'

// Cleanup old notifications at 2:00 AM IST
'0 2 * * *'
```

### Timezone
All scheduled jobs run in `Asia/Kolkata` (IST) timezone.

## User Preferences

### Notification Settings (in User model)
```javascript
notificationPreferences: {
  enabled: Boolean,           // Global notification toggle
  frequency: String,          // 'daily', 'twice-daily', 'custom'
  times: [String],           // Custom reminder times (HH:MM)
  email: Boolean             // Email notifications enabled
}
```

## Frontend Components

### Pages
- **`/notifications`** - Main notification management page
- **Tabs**: Today, All, Unread
- **Actions**: Mark as read, delete, mark all as read
- **Real-time updates**: Automatic refresh every 30 seconds

### Services
- **`notificationService.ts`** - API communication
- **`useNotifications.tsx`** - Context hook for notification state

### Features
- Pagination for large notification lists
- Visual indicators for unread notifications
- Priority-based styling
- Type-based icons (morning/evening reminders)
- Responsive design

## Development Tools

### Test Notification
```bash
POST /api/notifications/test
{
  "title": "Test Notification",
  "message": "This is a test message",
  "type": "info",
  "priority": "medium"
}
```

### Manual Triggers (in code)
```javascript
// Trigger morning reminders
notificationScheduler.triggerMorningReminders()

// Trigger evening reminders  
notificationScheduler.triggerEveningReminders()

// Trigger cleanup
notificationScheduler.triggerCleanup()
```

## Data Retention

### Automatic Cleanup
- **TTL Index**: Notifications automatically deleted after 24 hours
- **Manual Cleanup**: Daily job at 2:00 AM removes old notifications
- **User Action**: Users can manually delete notifications

### Benefits
- Prevents database bloat
- Maintains optimal performance
- Complies with data retention policies
- Keeps only relevant, recent notifications

## Security

### Authentication
- All notification endpoints require valid JWT token
- Users can only access their own notifications
- No cross-user data exposure

### Validation
- Input validation on all API endpoints
- Sanitized notification content
- Rate limiting on test notification creation

## Monitoring

### Logs
- Scheduler job execution status
- Notification creation/delivery status
- Error tracking for failed notifications
- Performance metrics

### Health Checks
- Scheduler status endpoint
- Database connection monitoring
- Job execution tracking

## Troubleshooting

### Common Issues

1. **Notifications not being created**
   - Check if user has `notificationPreferences.enabled: true`
   - Verify scheduler is running: `notificationScheduler.getStatus()`
   - Check database connection

2. **Timezone issues**
   - All jobs use 'Asia/Kolkata' timezone
   - Verify server timezone configuration
   - Check `scheduledFor` dates in database

3. **Cleanup not working**
   - TTL index should handle automatic deletion
   - Manual cleanup job runs at 2:00 AM daily
   - Check MongoDB TTL index status

### Debug Commands
```javascript
// Check scheduler status
notificationScheduler.getStatus()

// Manual test
notificationScheduler.createTestNotification(userId, 'morning')

// Check user preferences
User.findById(userId).select('notificationPreferences')
```