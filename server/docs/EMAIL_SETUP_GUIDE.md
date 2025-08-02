# Email Setup Guide - Send Real Emails

## 🚀 Quick Setup

The system now supports sending real emails! You just need to configure your `.env` file with SMTP settings.

## 📧 **Option 1: Gmail (Easiest for Testing)**

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Enable 2-Factor Authentication if not already enabled

### Step 2: Generate App Password
1. Go to Google Account → Security → 2-Step Verification
2. Scroll down to "App passwords"
3. Select "Mail" and your device
4. Copy the generated 16-character password

### Step 3: Configure .env file
Create/update `server/.env`:
```env
# Enable real emails
SEND_REAL_EMAILS=true

# Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
FROM_EMAIL=your-email@gmail.com

# Other required settings
MONGODB_URI=mongodb://localhost:27017/bp-monitor
JWT_SECRET=your-jwt-secret
CLIENT_URL=http://localhost:5173
```

## 📧 **Option 2: SendGrid (Recommended for Production)**

### Step 1: Create SendGrid Account
1. Sign up at https://sendgrid.com
2. Verify your account and domain

### Step 2: Generate API Key
1. Go to Settings → API Keys
2. Create a new API key with "Mail Send" permissions
3. Copy the API key

### Step 3: Configure .env file
```env
# Enable real emails
SEND_REAL_EMAILS=true

# SendGrid SMTP
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com

# Other settings...
```

## 📧 **Option 3: Mailgun**

### Step 1: Create Mailgun Account
1. Sign up at https://www.mailgun.com
2. Add and verify your domain

### Step 2: Get SMTP Credentials
1. Go to Domains → your domain → Domain Settings
2. Find SMTP credentials section

### Step 3: Configure .env file
```env
# Enable real emails
SEND_REAL_EMAILS=true

# Mailgun SMTP
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-smtp-username
SMTP_PASS=your-mailgun-smtp-password
FROM_EMAIL=noreply@yourdomain.com

# Other settings...
```

## 📧 **Option 4: Custom SMTP Provider**

Works with any SMTP provider (Outlook, Yahoo, etc.):

```env
# Enable real emails
SEND_REAL_EMAILS=true

# Custom SMTP
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
FROM_EMAIL=your-from-email@domain.com

# Other settings...
```

## 🛠️ **Complete .env Template**

```env
# Database
MONGODB_URI=mongodb://localhost:27017/bp-monitor

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Email Configuration
SEND_REAL_EMAILS=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com

# Frontend URL (for reset links)
CLIENT_URL=http://localhost:5173
```

## 🔧 **Testing the Setup**

1. **Update your .env file** with the settings above
2. **Restart the server** - you should see:
   ```
   📧 Configuring real email service with smtp.gmail.com...
   ✅ Real email service configured
      Host: smtp.gmail.com
      Port: 587
      From: your-email@gmail.com
   ✅ Email service initialized successfully
   ```

3. **Test forgot password** - you should see:
   ```
   📧 Password reset email sent!
      To: test@example.com
      Real email sent via SMTP
   ```

4. **Check your inbox** - you should receive a professional password reset email

## 🚨 **Troubleshooting**

### Gmail Issues
- **"Username and Password not accepted"**: Make sure you're using an App Password, not your regular password
- **"Less secure app access"**: This is no longer available; you must use App Passwords

### SendGrid Issues
- **Invalid API key**: Make sure the API key has Mail Send permissions
- **Domain verification**: Verify your domain in SendGrid dashboard

### General SMTP Issues
- **Connection timeout**: Check if your firewall blocks port 587
- **Authentication failed**: Verify username/password are correct
- **SSL/TLS errors**: Try using port 465 with `secure: true`

## 🔐 **Security Notes**

- **Never commit .env files** to version control
- **Use App Passwords** for Gmail, not your main password
- **Rotate credentials** regularly in production
- **Use domain emails** for production (not personal Gmail)

## 📊 **Production Recommendations**

1. **Use dedicated email service** (SendGrid, Mailgun)
2. **Set up SPF/DKIM records** for better deliverability
3. **Monitor email metrics** (delivery rates, bounces)
4. **Set up alerts** for email failures
5. **Use environment-specific FROM addresses**

---

Once configured, your password reset emails will be sent to real email addresses! 🎉