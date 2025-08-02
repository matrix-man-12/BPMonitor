# Password Reset System Documentation

## 🔐 Security Overview

The BP Monitor password reset system implements industry-standard security practices to ensure users can only reset their own passwords through email verification.

### Security Verification Strategy

1. **🔗 Cryptographically Secure Tokens**
   - 32-byte random tokens generated using Node.js crypto module
   - Tokens are hashed (SHA-256) before storage in database
   - Original token sent via email, hashed version stored in DB

2. **📧 Email-Only Verification**
   - Reset links sent ONLY to registered email addresses
   - Email acts as the "second factor" for authentication
   - Only person with email access can complete reset

3. **⏰ Time-Limited Access**
   - Tokens expire after 30 minutes
   - Short window reduces security risk
   - Expired tokens automatically invalidated

4. **🔄 Single-Use Tokens**
   - Token destroyed immediately after successful reset
   - Cannot be reused even if not expired
   - New request required for subsequent resets

5. **🚫 No User Enumeration**
   - Always returns "success" message regardless of email existence
   - Prevents attackers from discovering valid accounts
   - Actual emails only sent to existing users

## 🏗️ System Architecture

### Backend Components

#### User Model Extensions
- `resetPasswordToken`: Hashed token for verification
- `resetPasswordExpires`: Token expiration timestamp
- Methods: `generatePasswordResetToken()`, `validatePasswordResetToken()`, `clearPasswordResetToken()`

#### Email Service (`emailService.js`)
- Nodemailer integration for email delivery
- Development: Ethereal Email for testing
- Production: SMTP configuration support
- Professional HTML email templates

#### Auth Controller Endpoints
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/validate-reset-token/:token` - Validate token

### Frontend Components

#### Pages
- `/forgot-password` - Email submission form
- `/reset-password` - New password form (token from URL)

#### Auth Service
- API communication layer
- Token validation
- Password strength checking

## 📧 Email System

### Development Mode
- Uses Ethereal Email for testing
- Preview URLs logged to console
- No real emails sent

### Production Mode
- Requires SMTP configuration via environment variables:
  ```env
  SMTP_HOST=your-smtp-host
  SMTP_PORT=587
  SMTP_USER=your-email@domain.com
  SMTP_PASS=your-password
  FROM_EMAIL=noreply@bpmonitor.com
  CLIENT_URL=https://your-frontend-domain.com
  ```

### Email Template Features
- Professional HTML design with BP Monitor branding
- Responsive layout for mobile devices
- Security warnings and token expiration info
- Fallback plain text version

## 🔄 Password Reset Flow

### 1. Request Reset
```
User enters email → System validates → Generates token → Sends email
```

**Security Measures:**
- Always returns success (prevents enumeration)
- Only sends emails to existing active accounts
- Logs attempts for security monitoring

### 2. Email Delivery
```
Token hashed and stored → Email sent with plain token → User receives link
```

**Email Contains:**
- Secure reset link with token parameter
- 30-minute expiration warning
- Security instructions
- Link to support

### 3. Token Validation
```
User clicks link → Frontend validates token → Shows reset form if valid
```

**Validation Checks:**
- Token exists in database
- Token hasn't expired
- User account is still active

### 4. Password Reset
```
User submits new password → Token verified again → Password updated → Token cleared
```

**Security Features:**
- Re-validates token before reset
- Password strength requirements
- Clears token immediately after use
- Updates user's last login time

## 🛡️ Security Features

### Token Security
- **Generation**: `crypto.randomBytes(32).toString('hex')`
- **Storage**: SHA-256 hashed version only
- **Transmission**: Plain token via secure email
- **Lifetime**: 30 minutes maximum

### Password Requirements
- Minimum 6 characters
- At least one lowercase letter
- At least one uppercase letter  
- At least one number
- Visual strength indicator

### Attack Prevention
- **Brute Force**: Rate limiting on endpoints
- **Enumeration**: Consistent responses regardless of email validity
- **Token Reuse**: Single-use tokens destroyed after reset
- **Session Hijacking**: Stateless token-based system

## 🎨 User Experience

### Forgot Password Page
- Clean, professional design
- Email validation with real-time feedback
- Success state with clear instructions
- Help text for common issues

### Reset Password Page
- Token validation with loading states
- Password strength requirements display
- Real-time password matching
- Success confirmation with auto-redirect

### Error Handling
- User-friendly error messages
- Graceful handling of expired/invalid tokens
- Clear guidance for recovery steps

## 🔧 Development & Testing

### Test Email Functionality
```bash
# The system automatically creates test accounts in development
# Check console for Ethereal email credentials and preview URLs
```

### Manual Testing Scenarios
1. **Valid Email Reset**
   - Request reset for existing email
   - Check email/console for reset link
   - Complete password reset

2. **Invalid Email Request**
   - Request reset for non-existent email
   - Verify no email sent but success message shown

3. **Expired Token**
   - Generate reset link and wait 30+ minutes
   - Attempt to use expired token
   - Verify proper error handling

4. **Token Reuse**
   - Complete password reset successfully
   - Attempt to reuse same token
   - Verify token invalidation

### Environment Variables
```env
# Required for production email
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@bpmonitor.com

# Frontend URL for reset links
CLIENT_URL=https://your-domain.com

# Security (already configured)
JWT_SECRET=your-jwt-secret
```

## 📊 Monitoring & Logging

### Security Events Logged
- Password reset requests (email addresses)
- Failed token validations
- Successful password resets
- Email delivery failures

### Metrics to Monitor
- Reset request frequency
- Token expiration rates
- Email delivery success rates
- Failed validation attempts

## 🚨 Security Considerations

### Best Practices Implemented
- ✅ Secure token generation and storage
- ✅ Time-limited token expiration
- ✅ Single-use token consumption
- ✅ Email-based verification
- ✅ No user enumeration
- ✅ Password strength requirements
- ✅ Secure token transmission

### Additional Recommendations
- Monitor for unusual reset patterns
- Implement rate limiting on reset requests
- Consider CAPTCHA for high-volume sites
- Regular security audits of token generation
- Log analysis for attack detection

## 🔍 Troubleshooting

### Common Issues

1. **Emails Not Received**
   - Check spam/junk folders
   - Verify SMTP configuration in production
   - Check console logs for errors
   - Ensure FROM_EMAIL is configured

2. **Invalid Token Errors**
   - Token may have expired (30 minutes)
   - Token may have been used already
   - Check for URL copy/paste errors
   - Request new reset if needed

3. **Password Requirements**
   - Minimum 6 characters required
   - Must include upper, lower, and number
   - Password confirmation must match

### Debug Commands
```javascript
// Check user's reset token status
const user = await User.findOne({ email: 'user@example.com' });
console.log({
  hasToken: !!user.resetPasswordToken,
  expires: user.resetPasswordExpires,
  timeRemaining: user.resetPasswordExpires - Date.now()
});
```

## 📈 Future Enhancements

### Potential Improvements
- SMS-based password reset option
- Two-factor authentication integration
- Password reset attempt rate limiting
- Enhanced email templates with more branding
- Password history to prevent reuse
- Account lockout after multiple failed attempts

The password reset system provides enterprise-grade security while maintaining excellent user experience. All security measures follow OWASP guidelines and industry best practices.