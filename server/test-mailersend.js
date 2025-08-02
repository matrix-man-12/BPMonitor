const mailerSendService = require('./services/mailerSendService');

async function testMailerSend() {
  try {
    console.log('🧪 Testing MailerSend integration...');
    
    // Initialize the service
    await mailerSendService.initialize();
    console.log('✅ MailerSend service initialized successfully');
    
    // Test sending an email (you can uncomment and update with your email)
    // const result = await mailerSendService.sendPasswordResetEmail(
    //   'your-email@example.com',
    //   'test-token-123',
    //   'Test User'
    // );
    // console.log('✅ Test email sent:', result);
    
    console.log('🎉 MailerSend integration test passed!');
    
  } catch (error) {
    console.error('❌ MailerSend test failed:', error);
    
    // Check common issues
    if (error.message.includes('MAILERSEND_API_KEY')) {
      console.log('💡 Make sure MAILERSEND_API_KEY is set in your .env file');
    }
    
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      console.log('💡 Check that your API key is valid and has email permissions');
    }
    
    if (error.message.includes('domain')) {
      console.log('💡 Make sure your domain is verified in MailerSend dashboard');
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testMailerSend();
}

module.exports = testMailerSend;