const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const { formatDateTimeIST, getCurrentIST } = require('./utils/timeUtils');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN 
    : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const familyRoutes = require('./routes/family');
const bpReadingRoutes = require('./routes/bpReadings');
const notificationRoutes = require('./routes/notifications');

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'BP Monitor API is running!',
    timestamp: formatDateTimeIST(getCurrentIST()),
    uptime: process.uptime(),
    endpoints: {
      auth: '/api/auth',
      bpReadings: '/api/bp-readings',
      family: '/api/family',
      notifications: '/api/notifications'
    }
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'Connected'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/bp-readings', bpReadingRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling middleware (should be last)
app.use(errorHandler);

// Connect to database
connectDB();

// Initialize notification scheduler and email services
const notificationScheduler = require('./services/notificationScheduler');
const emailService = require('./services/emailService');
const mailerSendService = require('./services/mailerSendService');

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Initialize services after server starts
  setTimeout(async () => {
    notificationScheduler.initialize();
    
    // Initialize email services
    try {
      // Initialize MailerSend API service first (preferred)
      if (process.env.MAILERSEND_API_KEY) {
        await mailerSendService.initialize();
        console.log('📧 Using MailerSend API for emails');
      } else {
        // Fallback to SMTP service
        await emailService.initialize();
        console.log('📧 Using SMTP service for emails');
      }
    } catch (error) {
      console.error('⚠️  Email service initialization failed:', error.message);
      console.log('📧 Password reset emails may not work properly');
    }
  }, 2000); // Wait 2 seconds for database connection to stabilize
});
