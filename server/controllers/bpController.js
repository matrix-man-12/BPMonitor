const BPReading = require('../models/BPReading');
const mongoose = require('mongoose');
const { datetimeLocalToUTC, getCurrentIST } = require('../utils/timeUtils');

// @desc    Create a new BP reading
// @route   POST /api/bp-readings
// @access  Private
const createBPReading = async (req, res) => {
  try {
    const { systolic, diastolic, pulseRate, timestamp, comments, location, deviceUsed, tags } = req.body;

    // Validate required fields
    if (!systolic || !diastolic) {
      return res.status(400).json({
        success: false,
        message: 'Systolic and diastolic pressure are required'
      });
    }

    // Convert timestamp from datetime-local (IST) to UTC for storage
    const utcTimestamp = timestamp ? datetimeLocalToUTC(timestamp) : new Date();

    const reading = new BPReading({
      userId: req.user.id,
      systolic,
      diastolic,
      pulseRate,
      timestamp: utcTimestamp,
      comments,
      location,
      deviceUsed,
      tags: tags || []
    });

    const savedReading = await reading.save();

    res.status(201).json({
      success: true,
      message: 'BP reading created successfully',
      data: savedReading
    });

  } catch (error) {
    console.error('Create BP reading error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create BP reading'
    });
  }
};

// Get all BP readings for the authenticated user
const getBPReadings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      startDate,
      endDate,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    // Build filter query
    const filter = { userId: req.user._id };

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortDirection = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const readings = await BPReading.find(filter)
      .sort({ [sortBy]: sortDirection })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Get total count for pagination
    const totalCount = await BPReading.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      data: {
        readings,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get BP readings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch BP readings'
    });
  }
};

// Get a single BP reading by ID
const getBPReadingById = async (req, res) => {
  try {
    const { id } = req.params;

    const reading = await BPReading.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'BP reading not found'
      });
    }

    res.json({
      success: true,
      data: reading
    });
  } catch (error) {
    console.error('Get BP reading by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch BP reading'
    });
  }
};

// Update a BP reading
const updateBPReading = async (req, res) => {
  try {
    const readingId = req.params.id;
    const { systolic, diastolic, pulseRate, timestamp, comments, location, deviceUsed, tags } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(readingId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reading ID'
      });
    }

    // Find the reading
    const reading = await BPReading.findOne({ _id: readingId, userId: req.user.id });
    
    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'BP reading not found'
      });
    }

    // Update fields
    if (systolic !== undefined) reading.systolic = systolic;
    if (diastolic !== undefined) reading.diastolic = diastolic;
    if (pulseRate !== undefined) reading.pulseRate = pulseRate;
    if (timestamp !== undefined) reading.timestamp = datetimeLocalToUTC(timestamp);
    if (comments !== undefined) reading.comments = comments;
    if (location !== undefined) reading.location = location;
    if (deviceUsed !== undefined) reading.deviceUsed = deviceUsed;
    if (tags !== undefined) reading.tags = tags;

    // Update category if systolic or diastolic changed
    if (systolic !== undefined || diastolic !== undefined) {
      reading.updateCategory();
    }

    const updatedReading = await reading.save();

    res.json({
      success: true,
      message: 'BP reading updated successfully',
      data: updatedReading
    });

  } catch (error) {
    console.error('Update BP reading error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update BP reading'
    });
  }
};

// Delete a BP reading
const deleteBPReading = async (req, res) => {
  try {
    const { id } = req.params;

    const reading = await BPReading.findOneAndDelete({
      _id: id,
      userId: req.user._id
    });

    if (!reading) {
      return res.status(404).json({
        success: false,
        message: 'BP reading not found'
      });
    }

    res.json({
      success: true,
      message: 'BP reading deleted successfully',
      data: reading
    });
  } catch (error) {
    console.error('Delete BP reading error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete BP reading'
    });
  }
};

// Get BP reading statistics
const getBPStatistics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get readings for the period
    const readings = await BPReading.find({
      userId: req.user._id,
      timestamp: { $gte: startDate, $lte: now }
    }).sort({ timestamp: 1 });

    if (readings.length === 0) {
      return res.json({
        success: true,
        data: {
          totalReadings: 0,
          averageBP: null,
          categoryDistribution: {},
          trends: [],
          period
        }
      });
    }

    // Calculate statistics
    const totalReadings = readings.length;
    
    // Average BP
    const avgSystolic = Math.round(readings.reduce((sum, r) => sum + r.systolic, 0) / totalReadings);
    const avgDiastolic = Math.round(readings.reduce((sum, r) => sum + r.diastolic, 0) / totalReadings);
    const avgPulse = readings.filter(r => r.pulseRate).length > 0 
      ? Math.round(readings.filter(r => r.pulseRate).reduce((sum, r) => sum + (r.pulseRate || 0), 0) / readings.filter(r => r.pulseRate).length)
      : null;

    // Category distribution
    const categoryDistribution = readings.reduce((acc, reading) => {
      acc[reading.category] = (acc[reading.category] || 0) + 1;
      return acc;
    }, {});

    // Calculate percentage distribution
    Object.keys(categoryDistribution).forEach(category => {
      categoryDistribution[category] = {
        count: categoryDistribution[category],
        percentage: Math.round((categoryDistribution[category] / totalReadings) * 100)
      };
    });

    // Trend data (group by day/week based on period)
    const trends = [];
    const groupBy = period === '7d' ? 'day' : period === '30d' ? 'day' : 'week';
    
    if (groupBy === 'day') {
      // Group by day
      const dailyData = {};
      readings.forEach(reading => {
        const date = reading.timestamp.toISOString().split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = { systolic: [], diastolic: [], pulse: [] };
        }
        dailyData[date].systolic.push(reading.systolic);
        dailyData[date].diastolic.push(reading.diastolic);
        if (reading.pulseRate) dailyData[date].pulse.push(reading.pulseRate);
      });

      Object.keys(dailyData).forEach(date => {
        const data = dailyData[date];
        trends.push({
          date,
          avgSystolic: Math.round(data.systolic.reduce((a, b) => a + b, 0) / data.systolic.length),
          avgDiastolic: Math.round(data.diastolic.reduce((a, b) => a + b, 0) / data.diastolic.length),
          avgPulse: data.pulse.length > 0 ? Math.round(data.pulse.reduce((a, b) => a + b, 0) / data.pulse.length) : null,
          readingCount: data.systolic.length
        });
      });
    }

    res.json({
      success: true,
      data: {
        totalReadings,
        averageBP: {
          systolic: avgSystolic,
          diastolic: avgDiastolic,
          pulse: avgPulse
        },
        categoryDistribution,
        trends: trends.sort((a, b) => new Date(a.date) - new Date(b.date)),
        period,
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: now.toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Get BP statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch BP statistics'
    });
  }
};

// Get recent BP readings
const getRecentBPReadings = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const readings = await BPReading.find({ userId: req.user._id })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: readings
    });
  } catch (error) {
    console.error('Get recent BP readings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent BP readings'
    });
  }
};

// Get BP categories info
const getBPCategories = async (req, res) => {
  try {
    const categories = BPReading.getCategoryInfo();
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get BP categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch BP categories'
    });
  }
};

module.exports = {
  createBPReading,
  getBPReadings,
  getBPReadingById,
  updateBPReading,
  deleteBPReading,
  getBPStatistics,
  getRecentBPReadings,
  getBPCategories
}; 