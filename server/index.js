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
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const familyRoutes = require('./routes/family');
const bpReadingRoutes = require('./routes/bpReadings');

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'BP Monitor API is running!',
    timestamp: formatDateTimeIST(getCurrentIST()),
    uptime: process.uptime(),
    endpoints: {
      auth: '/api/auth',
      bpReadings: '/api/bp-readings',
      family: '/api/family'
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

// Error handling middleware (should be last)
app.use(errorHandler);

// Connect to database
connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
