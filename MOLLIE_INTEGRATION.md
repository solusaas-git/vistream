# Mollie Payment Integration Guide

## 🎯 Overview

This guide covers the complete Mollie payment integration for Vistream, providing a production-ready payment system with webhooks, database persistence, and comprehensive error handling.

## 🚀 Features

### ✅ Complete Payment Gateway Management
- **Multi-Provider Support**: Mollie, PayPal, Stripe with extensible architecture
- **Dynamic Configuration Forms**: Provider-specific setup with smart defaults
- **Real-time Testing**: Connection validation with actual API calls
- **Gateway Management**: Activate/deactivate, edit, delete with confirmations

### ✅ Mollie Integration
- **Payment Creation**: Full Mollie API integration with metadata support
- **Webhook Processing**: Secure webhook handling with signature verification
- **Database Persistence**: Complete payment tracking and history
- **Status Management**: Real-time payment status updates
- **Test Mode Support**: Seamless switching between test and production

### ✅ Security & Reliability
- **Authentication**: RBAC-based access control
- **Input Validation**: Comprehensive Zod schema validation
- **Error Handling**: Graceful error management with user feedback
- **Webhook Security**: Signature verification and replay protection
- **Database Integrity**: Proper indexing and data consistency

## 📁 File Structure

```
src/
├── app/
│   ├── admin/settings/page.tsx          # Payment gateway management UI
│   ├── api/
│   │   ├── admin/settings/payment-gateways/  # Gateway CRUD operations
│   │   ├── payments/
│   │   │   ├── create/route.ts          # Payment creation endpoint
│   │   │   └── [id]/route.ts           # Payment status checking
│   │   └── webhooks/mollie/route.ts     # Mollie webhook handler
│   └── test-payment/                    # Test pages for development
├── lib/
│   └── mollie.ts                        # Mollie service class
└── models/
    ├── PaymentGateway.js               # Gateway configuration model
    └── Payment.js                      # Payment records model
```

## 🛠️ Setup Instructions

### 1. Configure Mollie Gateway

1. **Access Admin Settings**:
   ```
   http://localhost:3000/admin/settings
   ```

2. **Add Mollie Gateway**:
   - Click "Ajouter Passerelle"
   - Select "Mollie" as provider
   - Fill in your Mollie API key
   - Configure test/production mode
   - Set webhook URL: `https://yourdomain.com/api/webhooks/mollie`

3. **Test Connection**:
   - Click the test button to verify API connectivity
   - Check console logs for detailed results

### 2. Mollie Account Setup

1. **Create Mollie Account**: [mollie.com](https://mollie.com)
2. **Get API Keys**: Dashboard → Developers → API Keys
3. **Test Keys**: Use `test_...` keys for development
4. **Live Keys**: Use `live_...` keys for production

### 3. Webhook Configuration

**Webhook URL**: `https://yourdomain.com/api/webhooks/mollie`

**Supported Events**:
- Payment status changes (paid, failed, canceled, expired)
- Automatic database updates
- Business logic triggers

## 💻 Usage Examples

### Creating a Payment

```typescript
const response = await fetch('/api/payments/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 29.99,
    currency: 'EUR',
    description: 'Subscription Premium',
    redirectUrl: 'https://yoursite.com/success',
    webhookUrl: 'https://yoursite.com/api/webhooks/mollie',
    metadata: {
      userId: 'user123',
      subscriptionId: 'sub456',
      plan: 'premium'
    }
  })
})

const { payment } = await response.json()
// Redirect user to: payment.checkoutUrl
```

### Checking Payment Status

```typescript
const response = await fetch(`/api/payments/${paymentId}`)
const { payment } = await response.json()

console.log(payment.status) // 'paid', 'pending', 'failed', etc.
```

### Using Mollie Service

```typescript
import { MollieService } from '@/lib/mollie'

// Create service instance
const mollie = await MollieService.fromActiveGateway()

// Create payment
const payment = await mollie.createPayment({
  amount: MollieService.formatAmount(29.99),
  description: 'Test Payment',
  redirectUrl: 'https://yoursite.com/success'
})

// Get payment methods
const methods = await mollie.getPaymentMethods({
  locale: 'fr_FR',
  amount: { currency: 'EUR', value: '29.99' }
})
```

## 🔧 Configuration Options

### Environment Variables

```env
# Add to your .env.local file
MOLLIE_API_KEY=test_your_api_key_here
MOLLIE_WEBHOOK_SECRET=your_webhook_secret
```

### Gateway Configuration

```javascript
{
  name: "Mollie Production",
  provider: "mollie",
  displayName: "Paiement par carte",
  description: "Paiements sécurisés via Mollie",
  configuration: {
    mollieApiKey: "live_...",
    mollieTestMode: false,
    webhookUrl: "https://yoursite.com/api/webhooks/mollie",
    webhookSecret: "optional_secret"
  },
  fees: {
    fixedFee: 0,
    percentageFee: 2.9,
    currency: "EUR"
  },
  limits: {
    minAmount: 0.01,
    maxAmount: 10000,
    currency: "EUR"
  }
}
```

## 🧪 Testing

### Test Payment Flow

1. **Visit Test Page**: `http://localhost:3000/test-payment`
2. **Create Test Payment**: Fill form and submit
3. **Complete Payment**: Use Mollie test cards
4. **Verify Webhook**: Check console logs
5. **Check Database**: Verify payment record

### Mollie Test Cards

```
Successful Payment:
- Card: 4242 4242 4242 4242
- Expiry: Any future date
- CVC: Any 3 digits

Failed Payment:
- Card: 4000 0000 0000 0002
```

### Webhook Testing

```bash
# Test webhook endpoint
curl -X POST http://localhost:3000/api/webhooks/mollie \
  -H "Content-Type: application/json" \
  -d '{"id": "tr_test123"}'
```

## 📊 Database Schema

### Payment Model

```javascript
{
  molliePaymentId: String,     // Mollie payment ID
  userId: ObjectId,            // User who made payment
  gatewayId: ObjectId,         // Payment gateway used
  amount: {
    value: Number,             // Amount in euros
    currency: String           // Currency code
  },
  status: String,              // Payment status
  description: String,         // Payment description
  metadata: Object,            // Custom metadata
  mollieCreatedAt: Date,       // Mollie creation timestamp
  molliePaidAt: Date,          // Payment completion timestamp
  isProcessed: Boolean,        // Business logic processed
  webhookAttempts: Number      // Webhook delivery attempts
}
```

## 🔒 Security Considerations

### Webhook Security

```typescript
// Verify webhook signature
const signature = request.headers.get('mollie-signature')
const expectedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(body)
  .digest('hex')

if (signature !== expectedSignature) {
  throw new Error('Invalid signature')
}
```

### API Key Protection

- Store API keys in environment variables
- Use `select: false` in database schema
- Mask keys in API responses
- Rotate keys regularly

## 🚨 Error Handling

### Common Issues

1. **Invalid API Key**:
   ```
   Error: Mollie API error: Invalid API key
   Solution: Check API key format and permissions
   ```

2. **Webhook Failures**:
   ```
   Error: Webhook signature verification failed
   Solution: Verify webhook secret configuration
   ```

3. **Payment Creation Errors**:
   ```
   Error: Amount too low
   Solution: Minimum amount is €0.01
   ```

### Monitoring

- Check webhook delivery logs
- Monitor payment status changes
- Track failed payment attempts
- Set up alerts for critical errors

## 🔄 Production Deployment

### Pre-deployment Checklist

- [ ] Switch to live Mollie API keys
- [ ] Configure production webhook URL
- [ ] Test webhook delivery
- [ ] Verify SSL certificate
- [ ] Set up monitoring
- [ ] Configure error alerts
- [ ] Test payment flow end-to-end

### Environment Setup

```env
# Production environment
MOLLIE_API_KEY=live_your_production_key
MOLLIE_WEBHOOK_SECRET=your_production_secret
NODE_ENV=production
```

## 📈 Analytics & Monitoring

### Key Metrics

- Payment success rate
- Average payment amount
- Popular payment methods
- Webhook delivery success
- Processing time

### Database Queries

```javascript
// Get payment statistics
const stats = await Payment.aggregate([
  { $match: { status: 'paid' } },
  { $group: {
    _id: null,
    totalAmount: { $sum: '$amount.value' },
    count: { $sum: 1 },
    avgAmount: { $avg: '$amount.value' }
  }}
])

// Get payments by status
const byStatus = await Payment.aggregate([
  { $group: {
    _id: '$status',
    count: { $sum: 1 }
  }}
])
```

## 🆘 Support & Troubleshooting

### Debug Mode

Enable detailed logging:

```javascript
// In webhook handler
console.log('Mollie webhook received:', {
  paymentId: paymentData.id,
  status: paymentData.status,
  amount: paymentData.amount,
  metadata: paymentData.metadata
})
```

### Common Solutions

1. **Payments not updating**: Check webhook URL accessibility
2. **Test mode issues**: Verify API key starts with `test_`
3. **Database errors**: Check MongoDB connection
4. **Authentication errors**: Verify user permissions

### Getting Help

- **Mollie Documentation**: [docs.mollie.com](https://docs.mollie.com)
- **Mollie Support**: Available in dashboard
- **Test Environment**: Use `/test-payment` for debugging

---

## 🎉 Congratulations!

Your Mollie integration is now production-ready! You have:

✅ **Complete payment processing**  
✅ **Secure webhook handling**  
✅ **Database persistence**  
✅ **Admin management interface**  
✅ **Comprehensive error handling**  
✅ **Test environment**  

The system is ready to handle real payments and scale with your business needs. 