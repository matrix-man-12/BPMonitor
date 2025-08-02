# 🚨 **MailerSend Domain Setup - URGENT FIX**

## ❌ **Current Error:**
```
The from.email must be a valid email address. #MS42208
```

## 🔍 **Root Cause:**
MailerSend requires you to use a **verified domain** for the FROM email address.

## 🛠️ **IMMEDIATE FIX OPTIONS:**

### **Option 1: Use MailerSend's Sandbox Domain (Testing Only)**
```env
FROM_EMAIL=test@mailersend.net
```
**Note**: Only for testing - emails may go to spam

### **Option 2: Add & Verify Your Own Domain (Recommended)**

#### **Step 1: Add Domain in MailerSend**
1. Go to [MailerSend Dashboard](https://app.mailersend.com)
2. Navigate to **Domains** → **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Click **Add Domain**

#### **Step 2: Add DNS Records**
Add these records to your DNS provider:

```dns
# SPF Record
Type: TXT
Name: @
Value: v=spf1 include:spf.mailersend.net ~all

# DKIM Record (MailerSend will provide these)
Type: TXT
Name: s1._domainkey
Value: [provided by MailerSend]

# DMARC Record (recommended)
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:admin@yourdomain.com
```

#### **Step 3: Verify Domain**
1. In MailerSend dashboard, click **Verify** next to your domain
2. Wait for verification (can take up to 24 hours)
3. Status should show ✅ **Verified**

#### **Step 4: Update Environment**
```env
FROM_EMAIL=noreply@yourdomain.com
```

### **Option 3: Use a Subdomain**
If you don't want to modify your main domain:

1. **Add subdomain**: `mail.yourdomain.com`
2. **Add DNS records** for the subdomain
3. **Use**: `FROM_EMAIL=noreply@mail.yourdomain.com`

## 🚀 **Quick Test Commands:**

### **Check Current Setup:**
```bash
cd server
node -e "
require('dotenv').config();
console.log('FROM_EMAIL:', process.env.FROM_EMAIL || 'NOT SET');
console.log('MAILERSEND_API_KEY:', process.env.MAILERSEND_API_KEY ? 'SET' : 'NOT SET');
"
```

### **Test with Sandbox Domain:**
```bash
# Update .env temporarily
echo "FROM_EMAIL=test@mailersend.net" >> .env

# Test the API
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "your-test-email@example.com"}'
```

## 📋 **Domain Verification Checklist:**

- [ ] Domain added in MailerSend dashboard
- [ ] SPF record added to DNS
- [ ] DKIM record added to DNS
- [ ] Domain status shows "Verified" ✅
- [ ] FROM_EMAIL updated to use verified domain
- [ ] Server restarted
- [ ] Test email sent successfully

## 🔧 **Troubleshooting:**

### **"Domain not found" Error:**
- Double-check DNS records are correctly added
- Wait up to 24 hours for DNS propagation
- Use DNS checker tools to verify records

### **"Still getting 422 error":**
- Ensure FROM_EMAIL exactly matches verified domain
- Check for typos in email address
- Restart your server after updating .env

### **"Emails going to spam":**
- Complete domain verification (all DNS records)
- Use professional FROM address (noreply@, hello@, etc.)
- Monitor sender reputation in MailerSend dashboard

## 🆘 **Emergency Workaround:**

If you need immediate testing and can't set up domain yet:

```bash
# Use MailerSend's test domain (temporary)
export FROM_EMAIL="test@mailersend.net"
npm start
```

**⚠️ Warning**: Test domain emails may be blocked or go to spam.

## 📞 **Need Help?**

1. **MailerSend Support**: [support@mailersend.com](mailto:support@mailersend.com)
2. **Documentation**: [https://developers.mailersend.com/](https://developers.mailersend.com/)
3. **Domain Setup Guide**: [MailerSend Domain Setup](https://www.mailersend.com/help/domain-setup)

---

**🎯 Once your domain is verified, your password reset emails will work perfectly!**