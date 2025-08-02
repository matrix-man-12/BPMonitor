const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const userId = req.user.id;

    // Build filter
    const filter = { userId };
    if (unreadOnly === 'true') {
      filter.isRead = false;
      filter.status = { $in: ['sent', 'delivered'] };
    }

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get notifications with pagination
    const notifications = await Notification.find(filter)
      .sort({ scheduledFor: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Get total count for pagination
    const totalNotifications = await Notification.countDocuments(filter);

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
      status: { $in: ['sent', 'delivered'] }
    });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalNotifications / parseInt(limit)),
          totalNotifications,
          hasNext: skip + notifications.length < totalNotifications,
          hasPrev: parseInt(page) > 1
        },
        unreadCount
      }
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

// @desc    Get today's notifications for user
// @route   GET /api/notifications/today
// @access  Private
const getTodayNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.getTodayForUser(userId);

    res.json({
      success: true,
      data: notifications
    });

  } catch (error) {
    console.error('Error fetching today\'s notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today\'s notifications',
      error: error.message
    });
  }
};

// @desc    Mark notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID'
      });
    }

    // Find and update notification
    const notification = await Notification.findOne({
      _id: id,
      userId: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.updateMany(
      { 
        userId: userId, 
        isRead: false 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID'
      });
    }

    // Find and delete notification
    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

// @desc    Get notification statistics
// @route   GET /api/notifications/stats
// @access  Private
const getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get various counts
    const [totalCount, unreadCount, todayCount] = await Promise.all([
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ 
        userId, 
        isRead: false,
        status: { $in: ['sent', 'delivered'] }
      }),
      Notification.countDocuments({
        userId,
        scheduledFor: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        total: totalCount,
        unread: unreadCount,
        today: todayCount,
        read: totalCount - unreadCount
      }
    });

  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification statistics',
      error: error.message
    });
  }
};

// @desc    Create test notification (for development)
// @route   POST /api/notifications/test
// @access  Private
const createTestNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, message, type = 'info', priority = 'medium' } = req.body;

    const notification = new Notification({
      userId,
      title: title || 'Test Notification',
      message: message || 'This is a test notification.',
      type,
      priority,
      scheduledFor: new Date(),
      status: 'sent',
      sentAt: new Date()
    });

    await notification.save();

    res.json({
      success: true,
      message: 'Test notification created',
      data: notification
    });

  } catch (error) {
    console.error('Error creating test notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create test notification',
      error: error.message
    });
  }
};

module.exports = {
  getNotifications,
  getTodayNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationStats,
  createTestNotification
};