require('dotenv').config();
const connectDB = require('./config/database');

// Simple database connection test
const testConnection = async () => {
  try {
    console.log('🔄 Testing MongoDB connection...');
    console.log('📝 MONGODB_URI:', process.env.MONGODB_URI ? 'Found' : 'NOT FOUND');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    await connectDB();
    console.log('✅ MongoDB connection successful!');
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

testConnection(); 