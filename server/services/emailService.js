const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  // Initialize the email transporter
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Check if we should send real emails or use test emails
      const shouldSendRealEmails = process.env.NODE_ENV === 'production' || process.env.SEND_REAL_EMAILS === 'true';

      if (shouldSendRealEmails && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        // Real SMTP configuration
        console.log(`📧 Configuring real email service with ${process.env.SMTP_HOST}...`);
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
        
        console.log('✅ Real email service configured');
        console.log(`   Host: ${process.env.SMTP_HOST}`);
        console.log(`   Port: ${process.env.SMTP_PORT || 587}`);
        console.log(`   From: ${process.env.FROM_EMAIL || process.env.SMTP_USER}`);
        
        // Special configuration tips for MailerSend
        if (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('mailersend')) {
          console.log('📧 MailerSend SMTP detected - additional features available:');
          console.log('   • Analytics and tracking');
          console.log('   • Template management');
          console.log('   • Webhook support');
          console.log('   • Consider upgrading to MailerSend API for full features');
        }
        
      } else {
        // Development: Use Ethereal Email for testing
        console.log('🧪 Creating test email account for development...');
        const testAccount = await nodemailer.createTestAccount();
        
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });

        console.log('📧 Test email account created:');
        console.log(`   User: ${testAccount.user}`);
        console.log(`   Pass: ${testAccount.pass}`);
        console.log('   Preview emails at: https://ethereal.email/messages');
        console.log('');
        console.log('💡 To send real emails, set these environment variables:');
        console.log('   SEND_REAL_EMAILS=true');
        console.log('   SMTP_HOST=your-smtp-host');
        console.log('   SMTP_USER=your-email@domain.com');
        console.log('   SMTP_PASS=your-password');
        console.log('   FROM_EMAIL=your-from-email@domain.com');
      }

      // Verify connection
      await this.transporter.verify();
      this.initialized = true;
      console.log('✅ Email service initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      throw error;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email, resetToken, userName) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: `"BP Monitor" <${process.env.FROM_EMAIL || 'noreply@bpmonitor.com'}>`,
        to: email,
        subject: 'Password Reset Request - BP Monitor',
        html: this.getPasswordResetEmailTemplate(userName, resetUrl, resetToken),
        text: this.getPasswordResetEmailText(userName, resetUrl)
      };

      const info = await this.transporter.sendMail(mailOptions);

      console.log('📧 Password reset email sent!');
      console.log('   To:', email);
      
      // In development with test emails, log the preview URL
      const shouldSendRealEmails = process.env.NODE_ENV === 'production' || process.env.SEND_REAL_EMAILS === 'true';
      if (!shouldSendRealEmails) {
        console.log('   Preview URL:', nodemailer.getTestMessageUrl(info));
      } else {
        console.log('   Real email sent via SMTP');
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl: process.env.NODE_ENV !== 'production' ? nodemailer.getTestMessageUrl(info) : null
      };

    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  // HTML email template for password reset
  getPasswordResetEmailTemplate(userName, resetUrl, resetToken) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - BP Monitor</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .email-container {
                background-color: #ffffff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 10px;
            }
            .title {
                font-size: 20px;
                color: #1f2937;
                margin-bottom: 20px;
            }
            .content {
                margin-bottom: 30px;
            }
            .reset-button {
                display: inline-block;
                background-color: #2563eb;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
            }
            .reset-button:hover {
                background-color: #1d4ed8;
            }
            .token-info {
                background-color: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 5px;
                padding: 15px;
                margin: 20px 0;
                font-family: monospace;
                word-break: break-all;
            }
            .warning {
                background-color: #fef2f2;
                border: 1px solid #fecaca;
                border-radius: 5px;
                padding: 15px;
                margin: 20px 0;
                color: #dc2626;
            }
            .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 14px;
                color: #6b7280;
                text-align: center;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">🩺 BP Monitor</div>
                <h1 class="title">Password Reset Request</h1>
            </div>
            
            <div class="content">
                <p>Hello ${userName || 'User'},</p>
                
                <p>We received a request to reset your password for your BP Monitor account. If you made this request, please click the button below to reset your password:</p>
                
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="reset-button">Reset My Password</a>
                </div>
                
                <p>Alternatively, you can copy and paste this link into your browser:</p>
                <div class="token-info">
                    ${resetUrl}
                </div>
                
                <div class="warning">
                    <strong>⚠️ Important Security Information:</strong>
                    <ul>
                        <li>This link will expire in <strong>30 minutes</strong></li>
                        <li>It can only be used <strong>once</strong></li>
                        <li>If you didn't request this reset, please ignore this email</li>
                        <li>Never share this link with anyone</li>
                    </ul>
                </div>
                
                <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                
                <p>For security reasons, this link will automatically expire after 30 minutes.</p>
            </div>
            
            <div class="footer">
                <p>This email was sent by BP Monitor</p>
                <p>If you have any questions, please contact our support team.</p>
                <p><small>Reset Token (for reference): ${resetToken.substring(0, 8)}...</small></p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Plain text version for password reset
  getPasswordResetEmailText(userName, resetUrl) {
    return `
BP Monitor - Password Reset Request

Hello ${userName || 'User'},

We received a request to reset your password for your BP Monitor account.

To reset your password, please visit the following link:
${resetUrl}

IMPORTANT SECURITY INFORMATION:
- This link will expire in 30 minutes
- It can only be used once
- If you didn't request this reset, please ignore this email
- Never share this link with anyone

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

For security reasons, this link will automatically expire after 30 minutes.

---
This email was sent by BP Monitor
If you have any questions, please contact our support team.
    `;
  }

  // Send welcome email (optional - for future use)
  async sendWelcomeEmail(email, userName) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const mailOptions = {
        from: `"BP Monitor" <${process.env.FROM_EMAIL || 'noreply@bpmonitor.com'}>`,
        to: email,
        subject: 'Welcome to BP Monitor!',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">🩺 Welcome to BP Monitor!</h1>
          <p>Hello ${userName},</p>
          <p>Thank you for joining BP Monitor! We're excited to help you track and manage your blood pressure readings.</p>
          <p>You can now:</p>
          <ul>
            <li>📊 Track your daily BP readings</li>
            <li>📈 View trends and analytics</li>
            <li>👨‍👩‍👧‍👦 Share with family members</li>
            <li>⏰ Get daily reminders</li>
          </ul>
          <p>Get started by taking your first BP reading!</p>
          <p>Best regards,<br>The BP Monitor Team</p>
        </div>
        `,
        text: `Welcome to BP Monitor!\n\nHello ${userName},\n\nThank you for joining BP Monitor! We're excited to help you track and manage your blood pressure readings.\n\nGet started by taking your first BP reading!\n\nBest regards,\nThe BP Monitor Team`
      };

      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId };

    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      // Don't throw error for welcome email - it's not critical
      return { success: false, error: error.message };
    }
  }

  // Test email functionality
  async sendTestEmail(email) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const mailOptions = {
        from: `"BP Monitor Test" <${process.env.FROM_EMAIL || 'noreply@bpmonitor.com'}>`,
        to: email,
        subject: 'Test Email - BP Monitor',
        html: '<h1>Test Email</h1><p>This is a test email from BP Monitor. If you received this, the email service is working correctly!</p>',
        text: 'Test Email - This is a test email from BP Monitor. If you received this, the email service is working correctly!'
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: info.messageId,
        previewUrl: process.env.NODE_ENV !== 'production' ? nodemailer.getTestMessageUrl(info) : null
      };

    } catch (error) {
      console.error('❌ Failed to send test email:', error);
      throw new Error('Failed to send test email');
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;