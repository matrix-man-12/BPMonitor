# MailerSend Testing Commands

## 🧪 **Verification Commands**

### 1. Check Setup
```bash
cd server
node verify-setup.js
```

### 2. Test MailerSend Service
```bash
cd server
node test-mailersend.js
```

### 3. Start Server
```bash
cd server
npm start
```

## 📧 **Test Email Sending**

### Test Forgot Password API:
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@example.com"}'
```

### Expected Response:
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

### Expected Console Output:
```
📧 MailerSend API service initialized successfully
   API Key: ms-xxxxxxxx...
   From Email: noreply@yourdomain.com
✅ Using MailerSend API for emails
Password reset email sent to: your-email@example.com
Provider: MailerSend API
Message ID: abc123def456
```

## 🔧 **Troubleshooting**

### Check Environment Variables:
```bash
cd server
echo "MAILERSEND_API_KEY: $MAILERSEND_API_KEY"
echo "FROM_EMAIL: $FROM_EMAIL"
```

### Verify Package Installation:
```bash
cd server
npm list mailersend
```

### Check Server Logs:
Look for these messages when server starts:
- ✅ "MailerSend API service initialized successfully"
- 📧 "Using MailerSend API for emails"

## 📊 **Monitor Results**

1. **Check Email Inbox** - Look for professional password reset email
2. **MailerSend Dashboard** - Visit https://app.mailersend.com to see analytics
3. **Console Logs** - Confirm successful API calls and message IDs

## 🚨 **Common Issues & Fixes**

### Issue: "MAILERSEND_API_KEY environment variable is required"
**Fix:** Add API key to .env file:
```bash
echo "MAILERSEND_API_KEY=your_actual_api_key" >> .env
```

### Issue: "401 Unauthorized"
**Fix:** Verify API key in MailerSend dashboard has email permissions

### Issue: "Domain not verified"
**Fix:** Verify your domain in MailerSend dashboard and add DNS records

### Issue: Emails going to spam
**Fix:** 
1. Set up SPF/DKIM records
2. Use verified domain for FROM_EMAIL
3. Monitor reputation in MailerSend dashboard

## 🎯 **Production Checklist**

- [ ] Domain verified in MailerSend
- [ ] SPF record added to DNS
- [ ] DKIM record added to DNS  
- [ ] FROM_EMAIL uses verified domain
- [ ] API key has proper permissions
- [ ] Rate limits configured
- [ ] Webhooks set up (optional)
- [ ] Monitoring dashboard access

---

**Ready to send professional emails with MailerSend! 🚀**