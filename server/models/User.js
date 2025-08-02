const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  dateOfBirth: {
    type: Date,
    required: false, // Made optional for existing users
    validate: {
      validator: function(date) {
        // Only validate if date is provided
        return !date || date < new Date();
      },
      message: 'Date of birth must be in the past'
    }
  },
  familyGroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyGroup'
  }],
  notificationPreferences: {
    enabled: {
      type: Boolean,
      default: true
    },
    frequency: {
      type: String,
      enum: ['daily', 'twice-daily', 'custom'],
      default: 'daily'
    },
    times: [{
      type: String,
      validate: {
        validator: function(time) {
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
        },
        message: 'Time must be in HH:MM format'
      }
    }],
    email: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for better performance (email unique index is already created by mongoose)
userSchema.index({ familyGroups: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const hashedPassword = await bcrypt.hash(this.password, 12);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get full name virtual
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Transform JSON output
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Instance method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  
  // Generate a random token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash the token and set it to resetPasswordToken field
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  
  // Set token expiry to 30 minutes from now
  this.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
  
  // Return the unhashed token (this will be sent in email)
  return resetToken;
};

// Instance method to validate password reset token
userSchema.methods.validatePasswordResetToken = function(token) {
  const crypto = require('crypto');
  
  // Hash the provided token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  // Check if token matches and hasn't expired
  return this.resetPasswordToken === hashedToken && this.resetPasswordExpires > Date.now();
};

// Instance method to clear password reset fields
userSchema.methods.clearPasswordResetToken = function() {
  this.resetPasswordToken = null;
  this.resetPasswordExpires = null;
};

module.exports = mongoose.model('User', userSchema); 