const mongoose = require('mongoose');
const { formatDateIST, formatTimeIST } = require('../utils/timeUtils');

const bpReadingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  systolic: {
    type: Number,
    required: [true, 'Systolic pressure is required'],
    min: [70, 'Systolic pressure must be at least 70 mmHg'],
    max: [250, 'Systolic pressure cannot exceed 250 mmHg'],
    validate: {
      validator: Number.isInteger,
      message: 'Systolic pressure must be a whole number'
    }
  },
  diastolic: {
    type: Number,
    required: [true, 'Diastolic pressure is required'],
    min: [40, 'Diastolic pressure must be at least 40 mmHg'],
    max: [150, 'Diastolic pressure cannot exceed 150 mmHg'],
    validate: {
      validator: Number.isInteger,
      message: 'Diastolic pressure must be a whole number'
    }
  },
  pulseRate: {
    type: Number,
    min: [30, 'Pulse rate must be at least 30 bpm'],
    max: [200, 'Pulse rate cannot exceed 200 bpm'],
    validate: {
      validator: function(value) {
        return value === undefined || value === null || Number.isInteger(value);
      },
      message: 'Pulse rate must be a whole number'
    }
  },
  timestamp: {
    type: Date,
    required: [true, 'Reading timestamp is required'],
    default: Date.now,
    validate: {
      validator: function(date) {
        // Allow up to 1 hour in the future to account for timezone conversion issues
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        return date <= oneHourFromNow;
      },
      message: 'Reading timestamp cannot be more than 1 hour in the future'
    }
  },
  comments: {
    type: String,
    maxlength: [500, 'Comments cannot exceed 500 characters'],
    trim: true
  },
  category: {
    type: String,
    enum: {
      values: ['very-low', 'low', 'normal', 'elevated', 'high-stage-1', 'high-stage-2', 'hypertensive-crisis'],
      message: 'Category must be one of: very-low, low, normal, elevated, high-stage-1, high-stage-2, hypertensive-crisis'
    },
    required: [true, 'BP category is required']
  },
  location: {
    type: String,
    maxlength: [100, 'Location cannot exceed 100 characters'],
    trim: true
  },
  deviceUsed: {
    type: String,
    maxlength: [100, 'Device name cannot exceed 100 characters'],
    trim: true
  },
  isValidated: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    maxlength: [50, 'Tag cannot exceed 50 characters'],
    trim: true
  }]
}, {
  timestamps: true
});

// Compound indexes for better query performance
bpReadingSchema.index({ userId: 1, timestamp: -1 });
bpReadingSchema.index({ userId: 1, category: 1 });
bpReadingSchema.index({ userId: 1, createdAt: -1 });

// Validation to ensure systolic is higher than diastolic
bpReadingSchema.pre('save', function(next) {
  if (this.systolic <= this.diastolic) {
    const error = new Error('Systolic pressure must be higher than diastolic pressure');
    error.name = 'ValidationError';
    return next(error);
  }
  next();
});

// Virtual for BP reading display
bpReadingSchema.virtual('bpDisplay').get(function() {
  return `${this.systolic}/${this.diastolic}`;
});

// Virtual for formatted timestamp
bpReadingSchema.virtual('formattedDate').get(function() {
  return formatDateIST(this.timestamp);
});

bpReadingSchema.virtual('formattedTime').get(function() {
  return formatTimeIST(this.timestamp);
});

// Ensure virtual fields are serialized
bpReadingSchema.set('toJSON', { virtuals: true });
bpReadingSchema.set('toObject', { virtuals: true });

// Static method to categorize BP reading
bpReadingSchema.statics.categorizeBP = function(systolic, diastolic) {
  if (systolic >= 180 || diastolic >= 120) {
    return 'hypertensive-crisis';
  } else if (systolic >= 140 || diastolic >= 90) {
    return 'high-stage-2';
  } else if (systolic >= 130 || diastolic >= 80) {
    return 'high-stage-1';
  } else if (systolic >= 120 && diastolic < 80) {
    return 'elevated';
  } else if (systolic >= 90 && diastolic >= 60) {
    return 'normal';
  } else if (systolic >= 80 && diastolic >= 50) {
    return 'low';
  } else {
    return 'very-low';
  }
};

// Instance method to update category
bpReadingSchema.methods.updateCategory = function() {
  this.category = this.constructor.categorizeBP(this.systolic, this.diastolic);
  return this;
};

// Static method to get category info
bpReadingSchema.statics.getCategoryInfo = function() {
  return {
    'very-low': { 
      label: 'Very Low (Severe Hypotension)', 
      color: '#7c3aed', 
      range: 'Less than 80 and less than 50',
      description: 'This is a medical emergency. Seek immediate medical attention!'
    },
    'low': { 
      label: 'Low (Hypotension)', 
      color: '#a855f7', 
      range: '80-89 and 50-59',
      description: 'You have low blood pressure. May cause dizziness or fainting.'
    },
    'normal': { 
      label: 'Normal', 
      color: '#22c55e', 
      range: '90-119 and 60-79',
      description: 'Your blood pressure is in the normal range.'
    },
    'elevated': { 
      label: 'Elevated', 
      color: '#eab308', 
      range: '120-129 and less than 80',
      description: 'Your blood pressure is elevated. May progress to hypertension.'
    },
    'high-stage-1': { 
      label: 'High – Stage 1 Hypertension', 
      color: '#f97316', 
      range: '130-139 or 80-89',
      description: 'You have Stage 1 high blood pressure. Consult your doctor.'
    },
    'high-stage-2': { 
      label: 'High – Stage 2 Hypertension', 
      color: '#ef4444', 
      range: '140-179 or 90-119',
      description: 'You have Stage 2 high blood pressure. Medical advice recommended.'
    },
    'hypertensive-crisis': { 
      label: 'Highly Elevated (Hypertensive Crisis)', 
      color: '#dc2626', 
      range: '180 or higher and/or 120 or higher',
      description: 'This is a medical emergency. Seek immediate medical attention!'
    }
  };
};

module.exports = mongoose.model('BPReading', bpReadingSchema); 