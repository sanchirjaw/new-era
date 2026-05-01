# Production Deployment Guide for edunewera.mn

## 🚀 Quick Deployment Checklist

### 1. Environment Variables
Set these in your production environment:

```bash
NEXT_PUBLIC_APP_URL=https://edunewera.mn
NODE_ENV=production
NEXTAUTH_URL=https://edunewera.mn
```

### 2. BYL Webhook Configuration
**CRITICAL**: Update your BYL webhook URL to:
```
https://edunewera.mn/api/payments/byl/webhook
```

### 3. Payment Flow URLs
The system will use these URLs in production:
- **Cancel URL**: `https://edunewera.mn/courses/{courseId}`
- **Success URL**: `https://edunewera.mn/courses/{courseId}?payment_success=true`

## 🔧 Key Features
- ✅ Payment flow with automatic enrollment
- ✅ BYL checkout integration
- ✅ Success URL redirects
- ✅ Webhook backup enrollment
- ✅ Production URL handling

## 🎯 Testing
1. Create a test course
2. Try payment flow
3. Verify enrollment after payment
4. Check course access

## 📞 Support
Contact system administrator for:
- Environment variable setup
- Database access
- API credentials
- Webhook configuration
