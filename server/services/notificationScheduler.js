const cron = require('node-cron');
const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationScheduler {
  constructor() {
    this.jobs = new Map();
    this.isInitialized = false;
  }

  // Initialize the scheduler with daily notification jobs
  initialize() {
    if (this.isInitialized) {
      console.log('⚠️  Notification scheduler already initialized');
      return;
    }

    try {
      // Schedule morning notifications at 7:00 AM every day
      const morningJob = cron.schedule('0 7 * * *', async () => {
        console.log('🌅 Running morning notification job...');
        await this.createDailyReminders('morning');
      }, {
        scheduled: true,
        timezone: 'Asia/Kolkata' // IST timezone
      });

      // Schedule evening notifications at 10:00 PM every day
      const eveningJob = cron.schedule('0 22 * * *', async () => {
        console.log('🌙 Running evening notification job...');
        await this.createDailyReminders('evening');
      }, {
        scheduled: true,
        timezone: 'Asia/Kolkata' // IST timezone
      });

      // Schedule daily cleanup at 2:00 AM every day
      const cleanupJob = cron.schedule('0 2 * * *', async () => {
        console.log('🧹 Running notification cleanup job...');
        await this.cleanupOldNotifications();
      }, {
        scheduled: true,
        timezone: 'Asia/Kolkata' // IST timezone
      });

      // Store job references
      this.jobs.set('morning', morningJob);
      this.jobs.set('evening', eveningJob);
      this.jobs.set('cleanup', cleanupJob);

      this.isInitialized = true;
      console.log('✅ Notification scheduler initialized successfully');
      console.log('📅 Morning reminders: 7:00 AM IST');
      console.log('📅 Evening reminders: 10:00 PM IST');
      console.log('📅 Cleanup job: 2:00 AM IST');

    } catch (error) {
      console.error('❌ Failed to initialize notification scheduler:', error);
    }
  }

  // Create daily reminder notifications for all active users
  async createDailyReminders(reminderType) {
    try {
      // Get all active users with notifications enabled
      const activeUsers = await User.find({
        isActive: true,
        'notificationPreferences.enabled': true
      }).select('_id firstName lastName notificationPreferences');

      if (activeUsers.length === 0) {
        console.log(`📭 No active users found for ${reminderType} reminders`);
        return;
      }

      const now = new Date();
      const scheduledTime = new Date();
      
      // Set scheduled time based on reminder type
      if (reminderType === 'morning') {
        scheduledTime.setHours(7, 0, 0, 0);
      } else if (reminderType === 'evening') {
        scheduledTime.setHours(22, 0, 0, 0);
      }

      let createdCount = 0;
      let skippedCount = 0;

      for (const user of activeUsers) {
        try {
          // Check if user already has a notification for this time today
          const existingNotification = await Notification.findOne({
            userId: user._id,
            'metadata.reminderType': reminderType,
            scheduledFor: {
              $gte: new Date(scheduledTime.getTime() - 60000), // 1 minute before
              $lte: new Date(scheduledTime.getTime() + 60000)  // 1 minute after
            }
          });

          if (existingNotification) {
            skippedCount++;
            continue;
          }

          // Create new notification
          const notification = Notification.createReminder(
            user._id,
            reminderType,
            scheduledTime
          );

          // Mark as sent immediately since it's for the current time
          notification.status = 'sent';
          notification.sentAt = now;

          await notification.save();
          createdCount++;

        } catch (userError) {
          console.error(`Error creating ${reminderType} reminder for user ${user._id}:`, userError);
        }
      }

      console.log(`📨 ${reminderType.charAt(0).toUpperCase() + reminderType.slice(1)} reminders: ${createdCount} created, ${skippedCount} skipped`);

    } catch (error) {
      console.error(`Error creating ${reminderType} reminders:`, error);
    }
  }

  // Clean up old notifications (older than 1 day)
  async cleanupOldNotifications() {
    try {
      const result = await Notification.cleanupOldNotifications();
      console.log(`🗑️  Cleaned up ${result.deletedCount} old notifications`);
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
    }
  }

  // Create immediate test notification for a user
  async createTestNotification(userId, reminderType = 'morning') {
    try {
      const notification = Notification.createReminder(
        userId,
        reminderType,
        new Date()
      );

      notification.status = 'sent';
      notification.sentAt = new Date();
      notification.title = `[TEST] ${notification.title}`;

      await notification.save();
      console.log(`✅ Test ${reminderType} notification created for user ${userId}`);
      return notification;
    } catch (error) {
      console.error('Error creating test notification:', error);
      throw error;
    }
  }

  // Stop all scheduled jobs
  stop() {
    if (!this.isInitialized) {
      console.log('⚠️  Notification scheduler is not running');
      return;
    }

    try {
      this.jobs.forEach((job, name) => {
        job.stop();
        console.log(`🛑 Stopped ${name} notification job`);
      });

      this.jobs.clear();
      this.isInitialized = false;
      console.log('✅ Notification scheduler stopped successfully');
    } catch (error) {
      console.error('❌ Error stopping notification scheduler:', error);
    }
  }

  // Get scheduler status
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      activeJobs: Array.from(this.jobs.keys()),
      jobCount: this.jobs.size
    };
  }

  // Manually trigger morning reminders (for testing)
  async triggerMorningReminders() {
    console.log('🧪 Manually triggering morning reminders...');
    await this.createDailyReminders('morning');
  }

  // Manually trigger evening reminders (for testing)
  async triggerEveningReminders() {
    console.log('🧪 Manually triggering evening reminders...');
    await this.createDailyReminders('evening');
  }

  // Manually trigger cleanup (for testing)
  async triggerCleanup() {
    console.log('🧪 Manually triggering notification cleanup...');
    await this.cleanupOldNotifications();
  }
}

// Create singleton instance
const notificationScheduler = new NotificationScheduler();

module.exports = notificationScheduler;