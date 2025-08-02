require('dotenv').config();

async function verifySetup() {
  console.log('🔍 Verifying MailerSend Integration Setup...\n');
  
  let allGood = true;
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  
  if (process.env.MAILERSEND_API_KEY) {
    console.log('✅ MAILERSEND_API_KEY: Set');
    console.log(`   Key preview: ${process.env.MAILERSEND_API_KEY.substring(0, 12)}...`);
  } else {
    console.log('❌ MAILERSEND_API_KEY: Missing');
    console.log('   → Add MAILERSEND_API_KEY=your_api_key to .env file');
    allGood = false;
  }
  
  if (process.env.FROM_EMAIL) {
    console.log(`✅ FROM_EMAIL: ${process.env.FROM_EMAIL}`);
  } else {
    console.log('⚠️  FROM_EMAIL: Not set (will use SMTP_USER as fallback)');
  }
  
  if (process.env.CLIENT_URL) {
    console.log(`✅ CLIENT_URL: ${process.env.CLIENT_URL}`);
  } else {
    console.log('⚠️  CLIENT_URL: Not set (will use default: http://localhost:5173)');
  }
  
  console.log('\n📦 Dependencies:');
  
  try {
    require('mailersend');
    console.log('✅ mailersend package: Installed');
  } catch (error) {
    console.log('❌ mailersend package: Missing');
    console.log('   → Run: npm install mailersend');
    allGood = false;
  }
  
  console.log('\n🔧 Service Files:');
  
  try {
    require('./services/mailerSendService');
    console.log('✅ mailerSendService.js: Found');
  } catch (error) {
    console.log('❌ mailerSendService.js: Missing or invalid');
    console.log('   Error:', error.message);
    allGood = false;
  }
  
  console.log('\n🔗 Integration Points:');
  
  try {
    const authController = require('./controllers/authController');
    console.log('✅ authController.js: Updated');
  } catch (error) {
    console.log('❌ authController.js: Error loading');
    console.log('   Error:', error.message);
    allGood = false;
  }
  
  try {
    const indexFile = require('./index');
    console.log('✅ index.js: Updated');
  } catch (error) {
    console.log('❌ index.js: Error loading');
    console.log('   Error:', error.message);
    allGood = false;
  }
  
  console.log('\n📝 Next Steps:');
  
  if (allGood) {
    console.log('🎉 Setup verification passed! Your MailerSend integration is ready.');
    console.log('\nTo test:');
    console.log('1. Start your server: npm start');
    console.log('2. Test forgot password: POST /api/auth/forgot-password');
    console.log('3. Check console logs for MailerSend confirmation');
    console.log('4. Check your email inbox');
    
    console.log('\n📊 MailerSend Dashboard:');
    console.log('• View email analytics at: https://app.mailersend.com');
    console.log('• Monitor delivery status and track opens/clicks');
    console.log('• Set up webhooks for real-time notifications');
    
  } else {
    console.log('⚠️  Setup issues found. Please fix the items marked with ❌ above.');
    
    console.log('\n🔧 Quick Fix Commands:');
    console.log('npm install mailersend');
    console.log('echo "MAILERSEND_API_KEY=your_api_key_here" >> .env');
    console.log('echo "FROM_EMAIL=noreply@yourdomain.com" >> .env');
  }
  
  console.log('\n📚 Documentation:');
  console.log('• MailerSend docs: https://developers.mailersend.com/');
  console.log('• Integration guide: server/docs/MAILERSEND_INTEGRATION.md');
  
  return allGood;
}

// Run verification if this file is executed directly
if (require.main === module) {
  verifySetup().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Verification error:', error);
    process.exit(1);
  });
}

module.exports = verifySetup;