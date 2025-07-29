const FamilyGroup = require('../models/FamilyGroup');
const User = require('../models/User');

// Create a new family group
const createFamilyGroup = async (req, res) => {
  try {
    const { name, description, settings = {} } = req.body;
    const userId = req.user._id;

    // Create new family group
    const familyGroup = new FamilyGroup({
      name,
      description,
      adminId: userId,
      settings: {
        ...settings,
        // Ensure defaults are set
        isPrivate: settings.isPrivate || false,
        allowSelfJoin: settings.allowSelfJoin !== false, // default true
        maxMembers: settings.maxMembers || 10,
        dataRetentionDays: settings.dataRetentionDays || 365
      }
    });

    // Add creator as admin member
    familyGroup.addMember(userId, null, 'admin');

    await familyGroup.save();

    // Update user's family groups
    await User.findByIdAndUpdate(userId, {
      $addToSet: { familyGroups: familyGroup._id }
    });

    // Populate admin and members data
    const populatedGroup = await FamilyGroup.findById(familyGroup._id)
      .populate('adminId', 'firstName lastName email')
      .populate('members.userId', 'firstName lastName email')
      .populate('members.invitedBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Family group created successfully',
      data: populatedGroup
    });
  } catch (error) {
    console.error('Create family group error:', error);
    
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
      message: 'Failed to create family group'
    });
  }
};

// Get user's family groups
const getUserFamilyGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const familyGroups = await FamilyGroup.find({
      'members.userId': userId,
      isActive: true
    })
    .populate('adminId', 'firstName lastName email')
    .populate('members.userId', 'firstName lastName email')
    .sort({ 'stats.lastActivity': -1 });

    res.json({
      success: true,
      data: familyGroups
    });
  } catch (error) {
    console.error('Get user family groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get family groups'
    });
  }
};

// Get specific family group
const getFamilyGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const familyGroup = await FamilyGroup.findById(groupId)
      .populate('adminId', 'firstName lastName email')
      .populate('members.userId', 'firstName lastName email')
      .populate('members.invitedBy', 'firstName lastName');

    if (!familyGroup || !familyGroup.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Family group not found'
      });
    }

    // Check if user is a member
    if (!familyGroup.isMember(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this family group'
      });
    }

    res.json({
      success: true,
      data: familyGroup
    });
  } catch (error) {
    console.error('Get family group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get family group'
    });
  }
};

// Update family group
const updateFamilyGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const { name, description, settings } = req.body;

    const familyGroup = await FamilyGroup.findById(groupId);

    if (!familyGroup || !familyGroup.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Family group not found'
      });
    }

    // Check permissions
    const memberPermissions = familyGroup.getMemberPermissions(userId);
    if (!memberPermissions || !memberPermissions.canEditGroupSettings) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to edit group settings'
      });
    }

    // Update fields
    if (name) familyGroup.name = name;
    if (description !== undefined) familyGroup.description = description;
    if (settings) {
      Object.assign(familyGroup.settings, settings);
    }

    familyGroup.stats.lastActivity = new Date();
    await familyGroup.save();

    const updatedGroup = await FamilyGroup.findById(groupId)
      .populate('adminId', 'firstName lastName email')
      .populate('members.userId', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Family group updated successfully',
      data: updatedGroup
    });
  } catch (error) {
    console.error('Update family group error:', error);
    
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
      message: 'Failed to update family group'
    });
  }
};

// Generate new invite code
const generateInviteCode = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const familyGroup = await FamilyGroup.findById(groupId);

    if (!familyGroup || !familyGroup.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Family group not found'
      });
    }

    // Check permissions
    const memberPermissions = familyGroup.getMemberPermissions(userId);
    if (!memberPermissions || !memberPermissions.canInviteMembers) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to generate invite codes'
      });
    }

    const newInviteCode = familyGroup.regenerateInviteCode();
    await familyGroup.save();

    res.json({
      success: true,
      message: 'New invite code generated successfully',
      data: {
        inviteCode: newInviteCode,
        inviteExpiry: familyGroup.inviteExpiry
      }
    });
  } catch (error) {
    console.error('Generate invite code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invite code'
    });
  }
};

// Join family group using invite code
const joinFamilyGroup = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user._id;

    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        message: 'Invite code is required'
      });
    }

    const familyGroup = await FamilyGroup.findByInviteCode(inviteCode);

    if (!familyGroup) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired invite code'
      });
    }

    if (!familyGroup.isInviteValid()) {
      return res.status(400).json({
        success: false,
        message: 'Invite code has expired'
      });
    }

    // Check if user is already a member
    if (familyGroup.isMember(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this family group'
      });
    }

    // Add user as member
    familyGroup.addMember(userId);
    await familyGroup.save();

    // Update user's family groups
    await User.findByIdAndUpdate(userId, {
      $addToSet: { familyGroups: familyGroup._id }
    });

    const updatedGroup = await FamilyGroup.findById(familyGroup._id)
      .populate('adminId', 'firstName lastName email')
      .populate('members.userId', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Successfully joined family group',
      data: updatedGroup
    });
  } catch (error) {
    console.error('Join family group error:', error);
    
    if (error.message.includes('already a member') || 
        error.message.includes('maximum member limit')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to join family group'
    });
  }
};

// Remove member from family group
const removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user._id;

    const familyGroup = await FamilyGroup.findById(groupId);

    if (!familyGroup || !familyGroup.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Family group not found'
      });
    }

    // Check permissions
    const userPermissions = familyGroup.getMemberPermissions(userId);
    const canRemove = userPermissions && 
      (userPermissions.canRemoveMembers || userId.toString() === memberId);

    if (!canRemove) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to remove members'
      });
    }

    // Remove member
    familyGroup.removeMember(memberId);
    await familyGroup.save();

    // Update user's family groups
    await User.findByIdAndUpdate(memberId, {
      $pull: { familyGroups: familyGroup._id }
    });

    const updatedGroup = await FamilyGroup.findById(groupId)
      .populate('adminId', 'firstName lastName email')
      .populate('members.userId', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Member removed successfully',
      data: updatedGroup
    });
  } catch (error) {
    console.error('Remove member error:', error);
    
    if (error.message.includes('not a member') || 
        error.message.includes('Cannot remove admin')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to remove member'
    });
  }
};

// Update member permissions
const updateMemberPermissions = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const { permissions } = req.body;
    const userId = req.user._id;

    const familyGroup = await FamilyGroup.findById(groupId);

    if (!familyGroup || !familyGroup.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Family group not found'
      });
    }

    // Only admin can update permissions
    if (!familyGroup.isAdmin(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admins can update member permissions'
      });
    }

    familyGroup.updateMemberPermissions(memberId, permissions);
    await familyGroup.save();

    const updatedGroup = await FamilyGroup.findById(groupId)
      .populate('adminId', 'firstName lastName email')
      .populate('members.userId', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Member permissions updated successfully',
      data: updatedGroup
    });
  } catch (error) {
    console.error('Update member permissions error:', error);
    
    if (error.message.includes('not a member') || 
        error.message.includes('Cannot modify admin')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update member permissions'
    });
  }
};

// Leave family group
const leaveFamilyGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const familyGroup = await FamilyGroup.findById(groupId);

    if (!familyGroup || !familyGroup.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Family group not found'
      });
    }

    // Admin cannot leave (must transfer ownership first)
    if (familyGroup.isAdmin(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Admin cannot leave group. Transfer ownership first or delete the group'
      });
    }

    // Remove user from group
    familyGroup.removeMember(userId);
    await familyGroup.save();

    // Update user's family groups
    await User.findByIdAndUpdate(userId, {
      $pull: { familyGroups: familyGroup._id }
    });

    res.json({
      success: true,
      message: 'Successfully left family group'
    });
  } catch (error) {
    console.error('Leave family group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to leave family group'
    });
  }
};

// Delete family group (admin only)
const deleteFamilyGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const familyGroup = await FamilyGroup.findById(groupId);

    if (!familyGroup || !familyGroup.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Family group not found'
      });
    }

    // Only admin can delete
    if (!familyGroup.isAdmin(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admin can delete family group'
      });
    }

    // Mark as inactive instead of actual deletion
    familyGroup.isActive = false;
    await familyGroup.save();

    // Remove group from all members' family groups
    const memberIds = familyGroup.members.map(member => member.userId);
    await User.updateMany(
      { _id: { $in: memberIds } },
      { $pull: { familyGroups: familyGroup._id } }
    );

    res.json({
      success: true,
      message: 'Family group deleted successfully'
    });
  } catch (error) {
    console.error('Delete family group error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete family group'
    });
  }
};

// Get invite preview information
const getInvitePreview = async (req, res) => {
  try {
    const { inviteCode } = req.params;

    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        message: 'Invite code is required'
      });
    }

    const familyGroup = await FamilyGroup.findByInviteCode(inviteCode)
      .populate('adminId', 'firstName lastName')
      .select('name description inviteExpiry stats members adminId');

    if (!familyGroup) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invite code'
      });
    }

    if (!familyGroup.isInviteValid()) {
      return res.status(400).json({
        success: false,
        message: 'Invite link has expired'
      });
    }

    // Return preview information (no sensitive data)
    res.json({
      success: true,
      data: {
        groupName: familyGroup.name,
        description: familyGroup.description,
        adminName: `${familyGroup.adminId.firstName} ${familyGroup.adminId.lastName}`,
        memberCount: familyGroup.members.length,
        expiresAt: familyGroup.inviteExpiry,
        isExpired: !familyGroup.isInviteValid()
      }
    });
  } catch (error) {
    console.error('Get invite preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get invite preview'
    });
  }
};

// Generate shareable invite link
const generateInviteLink = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const familyGroup = await FamilyGroup.findById(groupId);

    if (!familyGroup) {
      return res.status(404).json({
        success: false,
        message: 'Family group not found'
      });
    }

    // Check if user is admin or has permission to invite
    const member = familyGroup.members.find(m => 
      m.userId.toString() === userId.toString()
    );

    if (!member || (!familyGroup.isAdmin(userId) && !member.permissions.canInviteMembers)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to generate invite links'
      });
    }

    // Regenerate invite code and expiry
    const newInviteCode = familyGroup.regenerateInviteCode();
    await familyGroup.save();

    // Generate the full invite link
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const inviteLink = `${baseUrl}/family/join/${newInviteCode}`;

    res.json({
      success: true,
      message: 'Invite link generated successfully',
      data: {
        inviteCode: newInviteCode,
        inviteLink,
        expiresAt: familyGroup.inviteExpiry,
        expiresIn: '24 hours'
      }
    });
  } catch (error) {
    console.error('Generate invite link error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invite link'
    });
  }
};

// Join family group using invite link (different from code)
const joinFamilyGroupByLink = async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const userId = req.user._id;

    if (!inviteCode) {
      return res.status(400).json({
        success: false,
        message: 'Invite code is required'
      });
    }

    const familyGroup = await FamilyGroup.findByInviteCode(inviteCode);

    if (!familyGroup) {
      return res.status(404).json({
        success: false,
        message: 'Invalid invite link'
      });
    }

    if (!familyGroup.isInviteValid()) {
      return res.status(400).json({
        success: false,
        message: 'Invite link has expired'
      });
    }

    // Check if user is already a member
    if (familyGroup.isMember(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this family group'
      });
    }

    // Add user as member
    familyGroup.addMember(userId);
    await familyGroup.save();

    // Update user's family groups
    await User.findByIdAndUpdate(userId, {
      $addToSet: { familyGroups: familyGroup._id }
    });

    const updatedGroup = await FamilyGroup.findById(familyGroup._id)
      .populate('adminId', 'firstName lastName email')
      .populate('members.userId', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Successfully joined family group',
      data: updatedGroup
    });
  } catch (error) {
    console.error('Join family group by link error:', error);
    
    if (error.message.includes('already a member') || 
        error.message.includes('maximum member limit')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to join family group'
    });
  }
};

module.exports = {
  createFamilyGroup,
  getUserFamilyGroups,
  getFamilyGroup,
  updateFamilyGroup,
  generateInviteCode,
  generateInviteLink,
  getInvitePreview,
  joinFamilyGroup,
  joinFamilyGroupByLink,
  removeMember,
  updateMemberPermissions,
  leaveFamilyGroup,
  deleteFamilyGroup
}; 