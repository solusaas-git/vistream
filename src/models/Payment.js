import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema({
  // Payment provider
  provider: {
    type: String,
    required: true,
    enum: ['mollie', 'stripe', 'paypal'],
    index: true
  },
  
  // External payment ID (provider-specific)
  externalPaymentId: {
    type: String,
    required: true,
    index: true
  },
  
  // User who made the payment
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Payment gateway used
  gatewayId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentGateway',
    required: true
  },
  
  // Payment details
  amount: {
    value: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      default: 'EUR'
    }
  },
  
  description: {
    type: String,
    required: true,
    maxlength: 255
  },
  
  // Payment status (normalized across providers)
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'expired', 'refunded'],
    default: 'pending',
    index: true
  },
  
  // Payment method used
  method: String,
  
  // URLs
  redirectUrl: String,
  webhookUrl: String,
  checkoutUrl: String,
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Related entities
  relatedType: {
    type: String,
    enum: ['subscription', 'order', 'invoice', 'donation', 'other']
  },
  
  relatedId: mongoose.Schema.Types.ObjectId,
  
  // Payment timestamps
  paidAt: Date,
  expiresAt: Date,
  
  // Provider-specific data
  mollieData: {
    paymentId: String,
    checkoutUrl: String,
    method: String,
    profileId: String,
    settlementAmount: {
      value: String,
      currency: String
    }
  },
  
  stripeData: {
    sessionId: String,
    paymentIntentId: String,
    customerId: String,
    paymentStatus: String,
    receiptUrl: String,
    invoiceId: String,
    subscriptionId: String,
    failureReason: String,
    clientSecret: String
  },
  
  paypalData: {
    orderId: String,
    paymentId: String,
    payerId: String,
    facilitatorAccessToken: String
  },
  
  // Processing status
  isProcessed: {
    type: Boolean,
    default: false,
    index: true
  },
  
  processedAt: Date,
  
  // Webhook tracking
  webhookProcessedAt: Date,
  webhookAttempts: {
    type: Number,
    default: 0
  },
  
  // Sync tracking
  lastSyncAt: Date,
  
  // Status history
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled', 'expired', 'refunded']
    },
    timestamp: Date,
    source: String
  }]

}, {
  timestamps: true
})

// Indexes
paymentSchema.index({ userId: 1, status: 1 })
paymentSchema.index({ status: 1, createdAt: -1 })
paymentSchema.index({ provider: 1, externalPaymentId: 1 }, { unique: true })
paymentSchema.index({ 'mollieData.paymentId': 1 }, { sparse: true })
paymentSchema.index({ 'stripeData.sessionId': 1 }, { sparse: true })
paymentSchema.index({ 'stripeData.paymentIntentId': 1 }, { sparse: true })

// Add compound index to help with duplicate detection
paymentSchema.index({ 
  userId: 1, 
  provider: 1, 
  'amount.value': 1, 
  'amount.currency': 1, 
  description: 1,
  createdAt: -1 
})

// Methods
paymentSchema.methods.isSuccessful = function() {
  return this.status === 'completed'
}

paymentSchema.methods.isPending = function() {
  return this.status === 'pending'
}

paymentSchema.methods.isFailed = function() {
  return ['failed', 'cancelled', 'expired'].includes(this.status)
}

paymentSchema.methods.getProviderPaymentId = function() {
  switch (this.provider) {
    case 'mollie':
      return this.mollieData?.paymentId || this.externalPaymentId
    case 'stripe':
      return this.stripeData?.sessionId || this.stripeData?.paymentIntentId || this.externalPaymentId
    case 'paypal':
      return this.paypalData?.orderId || this.externalPaymentId
    default:
      return this.externalPaymentId
  }
}

paymentSchema.methods.getCheckoutUrl = function() {
  switch (this.provider) {
    case 'mollie':
      return this.mollieData?.checkoutUrl || this.checkoutUrl
    case 'stripe':
      return this.checkoutUrl // Stripe checkout URL is stored in main checkoutUrl field
    case 'paypal':
      return this.checkoutUrl
    default:
      return this.checkoutUrl
  }
}

// Force delete the model from cache to ensure schema updates
if (mongoose.models.Payment) {
  delete mongoose.models.Payment
}

export default mongoose.model('Payment', paymentSchema) 