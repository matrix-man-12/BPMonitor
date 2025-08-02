const express = require('express');
const {
  registerUser,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  forgotPassword,
  resetPassword,
  validateResetToken
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', login);

// Password reset routes (public)
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/validate-reset-token/:token', validateResetToken);

// Protected routes (require authentication)
router.use(authenticateToken); // All routes below this line require authentication

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.post('/logout', logout);

module.exports = router; 