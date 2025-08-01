const express = require('express');
const {
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
} = require('../controllers/familyController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Public routes (no authentication required)
router.get('/invite-preview/:inviteCode', getInvitePreview); // Get invite preview (public)

// All other family routes require authentication
router.use(authenticateToken);

// Family group management
router.post('/', createFamilyGroup);                    // Create new family group
router.get('/', getUserFamilyGroups);                   // Get user's family groups
router.get('/:groupId', getFamilyGroup);                // Get specific family group
router.put('/:groupId', updateFamilyGroup);             // Update family group
router.delete('/:groupId', deleteFamilyGroup);          // Delete family group

// Invite management
router.post('/:groupId/invite', generateInviteCode);        // Generate new invite code
router.post('/:groupId/invite-link', generateInviteLink);   // Generate shareable invite link
router.post('/join', joinFamilyGroup);                      // Join family group with invite code
router.post('/join/:inviteCode', joinFamilyGroupByLink);    // Join family group with invite link

// Member management
router.delete('/:groupId/members/:memberId', removeMember);              // Remove member
router.put('/:groupId/members/:memberId/permissions', updateMemberPermissions); // Update member permissions
router.post('/:groupId/leave', leaveFamilyGroup);       // Leave family group

module.exports = router; 