import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema({
  // Mollie payment ID
  molliePaymentId: {
    type: String,
    required: true,
    unique: true,
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
  
  // Payment status from Mollie
  status: {
    type: String,
    required: true,
    enum: ['open', 'canceled', 'pending', 'authorized', 'expired', 'failed', 'paid'],
    default: 'open',
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
  
  // Timestamps from Mollie
  mollieCreatedAt: Date,
  mollieExpiresAt: Date,
  molliePaidAt: Date,
  
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
  }

}, {
  timestamps: true
})

// Indexes
paymentSchema.index({ userId: 1, status: 1 })
paymentSchema.index({ status: 1, createdAt: -1 })

// Methods
paymentSchema.methods.isSuccessful = function() {
  return this.status === 'paid'
}

paymentSchema.methods.isPending = function() {
  return ['open', 'pending', 'authorized'].includes(this.status)
}

paymentSchema.methods.isFailed = function() {
  return ['canceled', 'expired', 'failed'].includes(this.status)
}

export default mongoose.models.Payment || mongoose.model('Payment', paymentSchema) 