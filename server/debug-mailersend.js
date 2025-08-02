require('dotenv').config();
const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');

async function debugMailerSend() {
  try {
    console.log('🔍 Debugging MailerSend integration...\n');
    
    // Check environment variables
    console.log('Environment Variables:');
    console.log('MAILERSEND_API_KEY:', process.env.MAILERSEND_API_KEY ? 'SET ✅' : 'MISSING ❌');
    console.log('FROM_EMAIL:', process.env.FROM_EMAIL || 'NOT SET ❌');
    console.log();
    
    if (!process.env.MAILERSEND_API_KEY) {
      throw new Error('MAILERSEND_API_KEY is not set');
    }
    
    if (!process.env.FROM_EMAIL) {
      throw new Error('FROM_EMAIL is not set');
    }
    
    // Initialize MailerSend
    console.log('📧 Initializing MailerSend...');
    const mailerSend = new MailerSend({
      apiKey: process.env.MAILERSEND_API_KEY,
    });
    console.log('✅ MailerSend initialized');
    
    // Prepare email data
    const fromEmail = process.env.FROM_EMAIL;
    const toEmail = 'test@example.com'; // Use a test email
    
    console.log(`\n📋 Email Configuration:`);
    console.log(`From: ${fromEmail}`);
    console.log(`To: ${toEmail}`);
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fromEmail)) {
      throw new Error(`Invalid FROM email format: ${fromEmail}`);
    }
    if (!emailRegex.test(toEmail)) {
      throw new Error(`Invalid TO email format: ${toEmail}`);
    }
    console.log('✅ Email formats valid');
    
    // Create email components
    console.log('\n🏗️  Creating email components...');
    const sentFrom = new Sender(fromEmail, "BP Monitor Test");
    const recipients = [new Recipient(toEmail, "Test User")];
    
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject("Test Email - MailerSend Debug")
      .setHtml("<h1>Test Email</h1><p>This is a test email from MailerSend integration.</p>")
      .setText("Test Email\n\nThis is a test email from MailerSend integration.");
    
    console.log('✅ Email components created');
    
    // Log the email params for debugging
    console.log('\n📝 Email Parameters:');
    console.log('Subject:', "Test Email - MailerSend Debug");
    console.log('From Email:', fromEmail);
    console.log('From Name:', "BP Monitor Test");
    console.log('To Email:', toEmail);
    console.log('To Name:', "Test User");
    
    // Attempt to send
    console.log('\n📤 Attempting to send email...');
    const response = await mailerSend.email.send(emailParams);
    
    console.log('✅ EMAIL SENT SUCCESSFULLY!');
    console.log('Response:', JSON.stringify(response, null, 2));
    
    return response;
    
  } catch (error) {
    console.error('\n❌ DEBUG FAILED:');
    console.error('Error:', error.message);
    
    if (error.statusCode) {
      console.error('Status Code:', error.statusCode);
    }
    
    if (error.body) {
      console.error('Response Body:', JSON.stringify(error.body, null, 2));
    }
    
    if (error.headers) {
      console.error('Response Headers:', JSON.stringify(error.headers, null, 2));
    }
    
    // Specific error guidance
    if (error.statusCode === 422) {
      console.error('\n🔧 422 Error Solutions:');
      console.error('1. Check if FROM_EMAIL is exactly: test-zy6v.mlsender.net');
      console.error('2. Ensure no extra spaces in email addresses');
      console.error('3. Verify API key is correct and has permissions');
    }
    
    if (error.statusCode === 401) {
      console.error('\n🔧 401 Error Solutions:');
      console.error('1. Check if MAILERSEND_API_KEY is correct');
      console.error('2. Verify API key has email sending permissions');
      console.error('3. Check if API key is expired');
    }
    
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  debugMailerSend()
    .then(() => {
      console.log('\n🎉 Debug completed successfully!');
      process.exit(0);
    })
    .catch(() => {
      console.log('\n💥 Debug failed!');
      process.exit(1);
    });
}

module.exports = debugMailerSend;