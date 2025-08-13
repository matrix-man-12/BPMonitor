const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getCurrentIST, datetimeLocalToUTC } = require('../utils/timeUtils');
const emailService = require('../services/emailService');
const mailerSendService = require('../services/mailerSendService');

// Register user
const registerUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, dateOfBirth } = req.body;

    // Check if user already exists (case-insensitive)
    const existingUser = await User.findByEmail(email);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = new User({
      email,
      // Let the User model's pre-save hook hash the password
      password: password,
      firstName,
      lastName,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      lastLogin: getCurrentIST()
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    // Update last login
    user.lastLogin = getCurrentIST();
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Register error:', error);
    
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
      message: 'Server error during registration'
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email (case-insensitive)
    const user = await User.findByEmail(email).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    // Update last login
    user.lastLogin = getCurrentIST();
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ['firstName', 'lastName', 'email', 'dateOfBirth', 'notificationPreferences'];
    const updates = {};

    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    // Convert dateOfBirth to Date if provided
    if (updates.dateOfBirth) {
      updates.dateOfBirth = new Date(updates.dateOfBirth);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
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
      message: 'Failed to update profile'
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    
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
      message: 'Failed to change password'
    });
  }
};

// Logout (client-side token removal, server-side could implement token blacklist)
const logout = async (req, res) => {
  try {
    // In a more advanced implementation, you might want to blacklist the token
    // For now, we'll just send a success response
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
};

// @desc    Forgot password - Send reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Always return success to prevent email enumeration
    const successResponse = {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    };

    // Find user by email
    const user = await User.findByEmail(email.toLowerCase());

    // If user doesn't exist, still return success (security best practice)
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return res.json(successResponse);
    }

    // If user is not active
    if (!user.isActive) {
      console.log(`Password reset requested for inactive user: ${email}`);
      return res.json(successResponse);
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    
    // Save user with reset token
    await user.save({ validateBeforeSave: false });

    try {
      // Initialize MailerSend service if not already done
      await mailerSendService.initialize();

      // Send password reset email via MailerSend API
      const emailResult = await mailerSendService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.fullName
      );

      console.log(`Password reset email sent to: ${user.email}`);
      console.log(`Provider: ${emailResult.provider}`);
      
      // Log message ID for tracking
      if (emailResult.messageId) {
        console.log(`Message ID: ${emailResult.messageId}`);
      }

      res.json(successResponse);

    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      
      // Clear the reset token if email fails
      user.clearPasswordResetToken();
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.'
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validate input
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Find user with valid reset token
    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token'
      });
    }

    // Validate token one more time using instance method
    if (!user.validatePasswordResetToken(token)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token'
      });
    }

    // Set new password
    user.password = newPassword;
    
    // Clear reset token fields
    user.clearPasswordResetToken();
    
    // Update last login
    user.lastLogin = getCurrentIST();

    // Save user (password will be hashed by pre-save middleware)
    await user.save();

    console.log(`Password reset successful for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

// @desc    Validate reset token
// @route   GET /api/auth/validate-reset-token/:token
// @access  Public
const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token is required'
      });
    }

    // Find user with valid reset token
    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('email firstName lastName resetPasswordExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token'
      });
    }

    // Calculate time remaining
    const timeRemaining = Math.max(0, user.resetPasswordExpires - Date.now());
    const minutesRemaining = Math.floor(timeRemaining / (1000 * 60));

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        email: user.email,
        userName: user.fullName,
        expiresAt: user.resetPasswordExpires,
        minutesRemaining
      }
    });

  } catch (error) {
    console.error('Validate reset token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  registerUser,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  forgotPassword,
  resetPassword,
  validateResetToken
}; 