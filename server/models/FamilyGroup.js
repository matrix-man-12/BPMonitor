const mongoose = require('mongoose');
const crypto = require('crypto');

const familyGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Family group name is required'],
    trim: true,
    maxlength: [100, 'Family group name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  inviteCode: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return crypto.randomBytes(4).toString('hex').toUpperCase();
    }
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Admin ID is required']
  },
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permissions: {
      canViewAllReadings: {
        type: Boolean,
        default: true
      },
      canInviteMembers: {
        type: Boolean,
        default: false
      },
      canRemoveMembers: {
        type: Boolean,
        default: false
      },
      canEditGroupSettings: {
        type: Boolean,
        default: false
      }
    }
  }],
  settings: {
    isPrivate: {
      type: Boolean,
      default: false
    },
    allowSelfJoin: {
      type: Boolean,
      default: true
    },
    maxMembers: {
      type: Number,
      default: 10,
      min: 2,
      max: 50
    },
    dataRetentionDays: {
      type: Number,
      default: 365, // 1 year
      min: 30,
      max: 3650 // 10 years
    }
  },
  inviteExpiry: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  stats: {
    totalMembers: {
      type: Number,
      default: 0
    },
    totalReadings: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance (inviteCode index is created by unique: true)
familyGroupSchema.index({ adminId: 1 });
familyGroupSchema.index({ 'members.userId': 1 });
familyGroupSchema.index({ isActive: 1 });

// Update stats before saving
familyGroupSchema.pre('save', function(next) {
  // Update total members count
  this.stats.totalMembers = this.members.length;
  
  next();
});

// Generate a unique invite code
familyGroupSchema.methods.generateInviteCode = function() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Regenerate invite code
familyGroupSchema.methods.regenerateInviteCode = function() {
  this.inviteCode = this.generateInviteCode();
  this.inviteExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
  return this.inviteCode;
};

// Check if invite code is valid
familyGroupSchema.methods.isInviteValid = function() {
  return this.isActive && this.inviteExpiry > new Date();
};

// Add member to family group
familyGroupSchema.methods.addMember = function(userId, invitedBy = null, role = 'member') {
  // Check if user is already a member
  const existingMember = this.members.find(member => 
    member.userId.toString() === userId.toString()
  );
  
  if (existingMember) {
    throw new Error('User is already a member of this family group');
  }
  
  // Check if group is at capacity
  if (this.members.length >= this.settings.maxMembers) {
    throw new Error('Family group has reached maximum member limit');
  }
  
  // Set admin permissions if this is the admin
  const permissions = role === 'admin' ? {
    canViewAllReadings: true,
    canInviteMembers: true,
    canRemoveMembers: true,
    canEditGroupSettings: true
  } : {
    canViewAllReadings: true,
    canInviteMembers: false,
    canRemoveMembers: false,
    canEditGroupSettings: false
  };
  
  this.members.push({
    userId,
    role,
    invitedBy,
    permissions
  });
  
  this.stats.lastActivity = new Date();
  return this;
};

// Remove member from family group
familyGroupSchema.methods.removeMember = function(userId) {
  const memberIndex = this.members.findIndex(member => 
    member.userId.toString() === userId.toString()
  );
  
  if (memberIndex === -1) {
    throw new Error('User is not a member of this family group');
  }
  
  // Cannot remove admin
  if (this.members[memberIndex].role === 'admin') {
    throw new Error('Cannot remove admin from family group');
  }
  
  this.members.splice(memberIndex, 1);
  this.stats.lastActivity = new Date();
  return this;
};

// Check if user is member
familyGroupSchema.methods.isMember = function(userId) {
  return this.members.some(member => 
    member.userId.toString() === userId.toString()
  );
};

// Check if user is admin
familyGroupSchema.methods.isAdmin = function(userId) {
  const member = this.members.find(member => 
    member.userId.toString() === userId.toString()
  );
  return member && member.role === 'admin';
};

// Get member permissions
familyGroupSchema.methods.getMemberPermissions = function(userId) {
  const member = this.members.find(member => 
    member.userId.toString() === userId.toString()
  );
  return member ? member.permissions : null;
};

// Update member permissions
familyGroupSchema.methods.updateMemberPermissions = function(userId, permissions) {
  const member = this.members.find(member => 
    member.userId.toString() === userId.toString()
  );
  
  if (!member) {
    throw new Error('User is not a member of this family group');
  }
  
  if (member.role === 'admin') {
    throw new Error('Cannot modify admin permissions');
  }
  
  Object.assign(member.permissions, permissions);
  this.stats.lastActivity = new Date();
  return this;
};

// Static method to find by invite code
familyGroupSchema.statics.findByInviteCode = function(inviteCode) {
  return this.findOne({ 
    inviteCode: inviteCode.toUpperCase(),
    isActive: true 
  });
};

// Virtual for member count
familyGroupSchema.virtual('memberCount').get(function() {
  return this.members.length;
});

// Transform JSON output
familyGroupSchema.methods.toJSON = function() {
  const obj = this.toObject();
  
  // Add virtual fields
  obj.memberCount = this.memberCount;
  obj.isInviteValid = this.isInviteValid();
  
  return obj;
};

module.exports = mongoose.model('FamilyGroup', familyGroupSchema); 