const { MailerSend, EmailParams, Sender, Recipient } = require('mailersend');

class MailerSendService {
  constructor() {
    this.mailerSend = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      if (!process.env.MAILERSEND_API_KEY) {
        throw new Error('MAILERSEND_API_KEY environment variable is required');
      }

      this.mailerSend = new MailerSend({
        apiKey: process.env.MAILERSEND_API_KEY,
      });

      this.initialized = true;
      console.log('✅ MailerSend API service initialized successfully');
      console.log(`   API Key: ${process.env.MAILERSEND_API_KEY.substring(0, 12)}...`);
      console.log(`   From Email: ${process.env.FROM_EMAIL || 'Not set'}`);

    } catch (error) {
      console.error('❌ Failed to initialize MailerSend API service:', error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email, resetToken, userName) {
    try {
      if (!this.initialized) {
        throw new Error('MailerSend service not initialized');
      }

      const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
      
      // Use FROM_EMAIL if set, otherwise try to use a valid default
      let fromEmail = process.env.FROM_EMAIL;
      
      if (!fromEmail) {
        // ⚠️ IMPORTANT: You must use a verified domain email address
        // Replace this with your actual verified domain
        fromEmail = 'noreply@yourdomain.com';
        console.warn('⚠️  FROM_EMAIL not set. Using default. Please verify your domain in MailerSend dashboard.');
      }
      
      // Ensure the email format is correct (add @ and proper domain if needed)
      if (!fromEmail.includes('@')) {
        // If it's just a domain, add noreply@ prefix
        fromEmail = `noreply@${fromEmail}`;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(fromEmail)) {
        throw new Error(`Invalid FROM email format: ${fromEmail}. Please use format: email@domain.com`);
      }
      
      console.log(`📧 Sending from: ${fromEmail}`);

      const sentFrom = new Sender(fromEmail, "BP Monitor");
      const recipients = [new Recipient(email, userName || "User")];

      const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setSubject("Password Reset Request - BP Monitor")
        .setHtml(this.getPasswordResetEmailTemplate(userName, resetUrl, resetToken))
        .setText(this.getPasswordResetEmailText(userName, resetUrl));

      const response = await this.mailerSend.email.send(emailParams);

      console.log('📧 Password reset email sent via MailerSend API!');
      console.log('   To:', email);
      console.log('   Message ID:', response.messageId || 'N/A');

      return {
        success: true,
        messageId: response.messageId,
        provider: 'MailerSend API'
      };

    } catch (error) {
      console.error('❌ Failed to send password reset email via MailerSend API:', error);
      
      // Provide specific error messages based on MailerSend error codes
      if (error.statusCode === 422) {
        if (error.body && error.body.message) {
          if (error.body.message.includes('from.email')) {
            const fromEmail = process.env.FROM_EMAIL || 'noreply@yourdomain.com';
            console.error('🚨 FROM EMAIL ERROR:');
            console.error(`   Current FROM_EMAIL: ${fromEmail}`);
            console.error('   Solutions:');
            console.error('   1. Verify your domain in MailerSend dashboard');
            console.error('   2. Update FROM_EMAIL to use your verified domain');
            console.error('   3. Example: FROM_EMAIL=noreply@yourverifieddomain.com');
            throw new Error(`Invalid FROM email address: ${fromEmail}. Please verify your domain in MailerSend dashboard.`);
          }
        }
      }
      
      if (error.statusCode === 401) {
        console.error('🚨 API KEY ERROR: Invalid or expired API key');
        throw new Error('Invalid MailerSend API key. Please check your credentials.');
      }
      
      if (error.statusCode === 429) {
        console.error('🚨 RATE LIMIT ERROR: Too many requests');
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      throw new Error('Failed to send password reset email. Please try again later.');
    }
  }

  getPasswordResetEmailTemplate(userName, resetUrl, resetToken) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - BP Monitor</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; }
          .warning { background-color: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🩺 BP Monitor</h1>
          <p>Password Reset Request</p>
        </div>
        <div class="content">
          <h2>Hello ${userName || 'User'}!</h2>
          <p>We received a request to reset the password for your BP Monitor account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #e2e8f0; padding: 10px; border-radius: 4px; font-family: monospace;">${resetUrl}</p>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <ul>
              <li>This link will expire in 30 minutes</li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>Never share this link with anyone</li>
            </ul>
          </div>
          
          <p>If you have any questions or concerns, please contact our support team.</p>
        </div>
        <div class="footer">
          <p>This email was sent from BP Monitor. If you didn't request this password reset, you can safely ignore this email.</p>
          <p>Reset Token (for support): ${resetToken.substring(0, 8)}...</p>
        </div>
      </body>
      </html>
    `;
  }

  getPasswordResetEmailText(userName, resetUrl) {
    return `
BP Monitor - Password Reset Request

Hello ${userName || 'User'}!

We received a request to reset the password for your BP Monitor account.

Please click the following link to reset your password:
${resetUrl}

SECURITY NOTICE:
- This link will expire in 30 minutes
- If you didn't request this reset, please ignore this email
- Never share this link with anyone

If you have any questions or concerns, please contact our support team.

---
This email was sent from BP Monitor. If you didn't request this password reset, you can safely ignore this email.
    `.trim();
  }
}

module.exports = new MailerSendService();