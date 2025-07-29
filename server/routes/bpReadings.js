const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createBPReading,
  getBPReadings,
  getBPReadingById,
  updateBPReading,
  deleteBPReading,
  getBPStatistics,
  getRecentBPReadings,
  getBPCategories
} = require('../controllers/bpController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// @route   POST /api/bp-readings
// @desc    Create a new BP reading
// @access  Private
router.post('/', createBPReading);

// @route   GET /api/bp-readings
// @desc    Get all BP readings for the authenticated user
// @access  Private
// @query   page, limit, category, startDate, endDate, sortBy, sortOrder
router.get('/', getBPReadings);

// @route   GET /api/bp-readings/recent
// @desc    Get recent BP readings
// @access  Private
// @query   limit
router.get('/recent', getRecentBPReadings);

// @route   GET /api/bp-readings/statistics
// @desc    Get BP reading statistics
// @access  Private
// @query   period (7d, 30d, 90d, 1y)
router.get('/statistics', getBPStatistics);

// @route   GET /api/bp-readings/categories
// @desc    Get BP category information
// @access  Private
router.get('/categories', getBPCategories);

// @route   GET /api/bp-readings/:id
// @desc    Get a single BP reading by ID
// @access  Private
router.get('/:id', getBPReadingById);

// @route   PUT /api/bp-readings/:id
// @desc    Update a BP reading
// @access  Private
router.put('/:id', updateBPReading);

// @route   DELETE /api/bp-readings/:id
// @desc    Delete a BP reading
// @access  Private
router.delete('/:id', deleteBPReading);

module.exports = router; 