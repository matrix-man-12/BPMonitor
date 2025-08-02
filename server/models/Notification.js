const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: {
      values: ['reminder', 'alert', 'info', 'system'],
      message: 'Type must be one of: reminder, alert, info, system'
    },
    default: 'reminder'
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: 'Priority must be one of: low, medium, high, urgent'
    },
    default: 'medium'
  },
  scheduledFor: {
    type: Date,
    required: [true, 'Scheduled time is required'],
    index: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  sentAt: {
    type: Date
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'sent', 'delivered', 'failed'],
      message: 'Status must be one of: pending, sent, delivered, failed'
    },
    default: 'pending'
  },
  metadata: {
    reminderType: {
      type: String,
      enum: ['morning', 'evening'],
      required: function() {
        return this.type === 'reminder';
      }
    },
    recurring: {
      type: Boolean,
      default: true
    },
    channel: {
      type: String,
      enum: ['app', 'email', 'both'],
      default: 'app'
    }
  },
  errorMessage: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound indexes for better query performance
notificationSchema.index({ userId: 1, scheduledFor: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ status: 1, scheduledFor: 1 });
notificationSchema.index({ scheduledFor: 1, status: 1 });

// TTL index to automatically delete old notifications after 1 day
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // 24 hours

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Instance method to mark as sent
notificationSchema.methods.markAsSent = function() {
  this.status = 'sent';
  this.sentAt = new Date();
  return this.save();
};

// Instance method to mark as failed
notificationSchema.methods.markAsFailed = function(errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  return this.save();
};

// Static method to get user's unread notifications
notificationSchema.statics.getUnreadForUser = function(userId) {
  return this.find({ 
    userId: userId, 
    isRead: false,
    status: { $in: ['sent', 'delivered'] }
  }).sort({ scheduledFor: -1 });
};

// Static method to get today's notifications for user
notificationSchema.statics.getTodayForUser = function(userId) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  return this.find({
    userId: userId,
    scheduledFor: {
      $gte: startOfDay,
      $lt: endOfDay
    }
  }).sort({ scheduledFor: -1 });
};

// Static method to create reminder notification
notificationSchema.statics.createReminder = function(userId, reminderType, scheduledFor) {
  const messages = {
    morning: {
      title: 'Morning BP Reminder',
      message: 'Good morning! It\'s time to take your blood pressure reading for the day.'
    },
    evening: {
      title: 'Evening BP Reminder', 
      message: 'Good evening! Don\'t forget to take your evening blood pressure reading.'
    }
  };

  const reminderData = messages[reminderType];
  
  return new this({
    userId,
    title: reminderData.title,
    message: reminderData.message,
    type: 'reminder',
    priority: 'medium',
    scheduledFor,
    metadata: {
      reminderType,
      recurring: true,
      channel: 'app'
    }
  });
};

// Static method to clean up old notifications (older than 1 day)
notificationSchema.statics.cleanupOldNotifications = function() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return this.deleteMany({
    createdAt: { $lt: oneDayAgo }
  });
};

module.exports = mongoose.model('Notification', notificationSchema);