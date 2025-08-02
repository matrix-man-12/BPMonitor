# MailerSend Integration Guide

## 🚀 **Overview**

MailerSend is a powerful transactional email service that provides both API and SMTP options. This guide shows you how to integrate it with your BP Monitor application.

## 📧 **Option 1: MailerSend API (Recommended)**

### **Benefits:**
- ✅ Advanced analytics and tracking
- ✅ Professional email templates
- ✅ Webhook support for real-time notifications
- ✅ Better deliverability management
- ✅ Suppression list management
- ✅ Detailed activity logs

### **Setup Steps:**

1. **Install MailerSend SDK:**
   ```bash
   cd server && npm install mailersend
   ```

2. **Get API Key:**
   - Sign up at [MailerSend](https://www.mailersend.com)
   - Go to Integrations → API Tokens
   - Generate new token with email permissions

3. **Configure Environment:**
   ```env
   # .env file
   MAILERSEND_API_KEY=your_api_key_here
   FROM_EMAIL=noreply@yourdomain.com
   SEND_REAL_EMAILS=true
   ```

4. **Update your auth controller to use MailerSend API:**
   ```javascript
   // In server/controllers/authController.js
   const mailerSendService = require('../services/mailerSendService');
   
   // Replace the emailService.sendPasswordResetEmail call with:
   await mailerSendService.sendPasswordResetEmail(email, resetToken, user.name);
   ```

## 📧 **Option 2: MailerSend SMTP**

### **Benefits:**
- ✅ Easy integration with existing Nodemailer setup
- ✅ No code changes required
- ✅ Analytics available in MailerSend dashboard

### **Setup Steps:**

1. **Get SMTP Credentials:**
   - Sign up at [MailerSend](https://www.mailersend.com)
   - Go to Domains → Add your domain
   - Go to Domains → [Your Domain] → SMTP → Generate new user

2. **Configure Environment:**
   ```env
   # .env file
   SEND_REAL_EMAILS=true
   SMTP_HOST=smtp.mailersend.net
   SMTP_PORT=587
   SMTP_USER=your_mailersend_username
   SMTP_PASS=your_mailersend_password
   FROM_EMAIL=noreply@yourdomain.com
   ```

## 🔧 **Required Dependencies**

### **For API Option:**
```json
{
  "mailersend": "^2.6.0"
}
```

### **For SMTP Option:**
No additional dependencies needed (uses existing Nodemailer)

## 🏗️ **Domain Setup (Important!)**

### **1. Add Your Domain:**
- In MailerSend dashboard, go to Domains
- Add your domain (e.g., `yourdomain.com`)
- Complete domain verification

### **2. DNS Records (Required for deliverability):**
Add these DNS records to your domain:

```dns
# SPF Record
Type: TXT
Name: @
Value: v=spf1 include:mailersend.net ~all

# DKIM Record
Type: TXT
Name: [provided by MailerSend]
Value: [provided by MailerSend]

# DMARC Record (Optional but recommended)
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:admin@yourdomain.com
```

## ⚡ **Performance & Features Comparison**

| Feature | Current Setup | MailerSend SMTP | MailerSend API |
|---------|---------------|-----------------|----------------|
| Send Emails | ✅ | ✅ | ✅ |
| Analytics | ❌ | ✅ | ✅ |
| Templates | ❌ | ✅ | ✅ |
| Webhooks | ❌ | ✅ | ✅ |
| Bounce Handling | ❌ | ✅ | ✅ |
| Suppression Lists | ❌ | ✅ | ✅ |
| Advanced Tracking | ❌ | ✅ | ✅ |
| Rate Limiting | Manual | Automatic | Automatic |

## 🔐 **Security Features**

MailerSend includes:
- **SPF/DKIM/DMARC** authentication
- **TLS encryption** for all connections
- **API key security** with scoped permissions
- **IP filtering** and access controls
- **Webhook signature verification**

## 📊 **Monitoring & Analytics**

### **Available Metrics:**
- Email delivery rates
- Open rates and click tracking
- Bounce and complaint rates
- Geographic data
- Device and client information

### **Real-time Webhooks:**
```javascript
// Example webhook events you can receive:
{
  "type": "activity.sent",
  "email": "user@example.com",
  "timestamp": 1234567890,
  "message_id": "abc123"
}
```

## 🚨 **Migration Steps**

### **From Current Setup to MailerSend API:**

1. Install MailerSend package
2. Add API key to environment
3. Update import in authController:
   ```javascript
   // Replace this:
   const emailService = require('../services/emailService');
   
   // With this:
   const mailerSendService = require('../services/mailerSendService');
   ```
4. Update method call in forgotPassword function
5. Test with real email address

### **From Current Setup to MailerSend SMTP:**

1. Update environment variables
2. No code changes needed!
3. Restart server
4. Test with real email address

## 🧪 **Testing**

### **Test Commands:**
```bash
# Test API integration
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@yourdomain.com"}'

# Check server logs for confirmation
```

### **What to Look For:**
- ✅ "MailerSend API service initialized successfully"
- ✅ "Password reset email sent via MailerSend API!"
- ✅ Email received in inbox (not spam)

## 💡 **Recommended Setup**

For production use, we recommend:

1. **Start with MailerSend API** for maximum features
2. **Set up proper domain authentication** (SPF/DKIM)
3. **Configure webhooks** for bounce handling
4. **Use professional from address** (noreply@yourdomain.com)
5. **Monitor analytics** regularly

## 🆘 **Troubleshooting**

### **Common Issues:**

**API Key Invalid:**
- Verify API key in MailerSend dashboard
- Check environment variable spelling
- Ensure key has email permissions

**Domain Not Verified:**
- Complete domain verification in dashboard
- Add required DNS records
- Wait for propagation (up to 24 hours)

**Emails Going to Spam:**
- Set up SPF/DKIM records
- Use verified domain for FROM address
- Monitor reputation in dashboard

**Rate Limiting:**
- MailerSend has generous limits
- Check your plan limits in dashboard
- Implement retry logic if needed

## 📚 **Additional Resources**

- [MailerSend Documentation](https://developers.mailersend.com/)
- [Node.js SDK](https://github.com/mailersend/mailersend-nodejs)
- [Email Best Practices](https://www.mailersend.com/blog)
- [Deliverability Guide](https://www.mailersend.com/help/deliverability)

---

**🎉 Ready to send professional emails with MailerSend!**