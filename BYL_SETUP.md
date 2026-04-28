# Byl Payment Integration Setup

This guide explains how to set up the Byl payment system integration in your New Era Platform.

## Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# Byl Configuration
BYL_API_BASE_URL=https://byl.mn/api/v1
BYL_PROJECT_ID=your_byl_project_id
BYL_API_TOKEN=your_byl_api_token
BYL_WEBHOOK_SECRET=your_byl_webhook_secret
```

## Setup Steps

### 1. Get Byl Project ID and API Token

1. Log in to your Byl account at [byl.mn](https://byl.mn)
2. Go to your project settings
3. Note down your Project ID
4. Go to API Tokens section and create a new token
5. Copy the token (it will only be shown once)

### 2. Configure Webhook

1. In your Byl project settings, go to Webhooks section
2. Add a new webhook with the following URL:
   ```
   https://yourdomain.com/api/payments/byl/webhook
   ```
3. Copy the webhook secret

### 3. Update Environment Variables

Replace the placeholder values in your `.env.local`:

```bash
BYL_PROJECT_ID=12345
BYL_API_TOKEN=by_1234567890abcdef...
BYL_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

## Features

### Payment Methods

The system now supports two payment methods:

1. **QPay** - Traditional QR code and app-based payments
2. **Byl** - Modern checkout system with multiple payment options

### Byl Checkout

- Creates a professional checkout page
- Supports multiple payment methods
- Automatic enrollment after successful payment
- Webhook-based payment confirmation

### Byl Invoices

- Generate invoices for manual payment
- Track payment status
- Void or delete invoices as needed

## API Endpoints

### Create Byl Payment
```
POST /api/payments/byl/create
```

### Byl Webhook
```
POST /api/payments/byl/webhook
```

## Webhook Events

The system handles these Byl webhook events:

- `invoice.paid` - When an invoice is paid
- `checkout.completed` - When a checkout is completed

## Testing

1. Set up your environment variables
2. Create a test course
3. Try making a payment with Byl
4. Check webhook delivery in Byl dashboard

## Troubleshooting

### Common Issues

1. **Invalid API Token**: Check your BYL_API_TOKEN environment variable
2. **Webhook Not Working**: Verify BYL_WEBHOOK_SECRET and webhook URL
3. **Payment Not Completing**: Check webhook logs and Byl dashboard

### Debug Mode

Enable debug logging by checking the browser console and server logs for detailed error messages.

## Security

- All webhook requests are verified using HMAC signatures
- API tokens are stored securely in environment variables
- Payment data is encrypted and stored securely

## Support

For Byl-specific issues, contact Byl support at [byl.mn](https://byl.mn)
For platform integration issues, check the platform documentation.
