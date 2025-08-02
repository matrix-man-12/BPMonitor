const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getNotifications,
  getTodayNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationStats,
  createTestNotification
} = require('../controllers/notificationController');

// @route   GET /api/notifications
// @desc    Get user's notifications with pagination
// @access  Private
// @query   page, limit, unreadOnly
router.get('/', authenticateToken, getNotifications);

// @route   GET /api/notifications/today
// @desc    Get today's notifications for user
// @access  Private
router.get('/today', authenticateToken, getTodayNotifications);

// @route   GET /api/notifications/stats
// @desc    Get notification statistics
// @access  Private
router.get('/stats', authenticateToken, getNotificationStats);

// @route   PATCH /api/notifications/:id/read
// @desc    Mark specific notification as read
// @access  Private
router.patch('/:id/read', authenticateToken, markAsRead);

// @route   PATCH /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.patch('/read-all', authenticateToken, markAllAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Delete specific notification
// @access  Private
router.delete('/:id', authenticateToken, deleteNotification);

// @route   POST /api/notifications/test
// @desc    Create test notification (for development)
// @access  Private
router.post('/test', authenticateToken, createTestNotification);

module.exports = router;