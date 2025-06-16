import mongoose from 'mongoose'

const paymentGatewaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  provider: {
    type: String,
    required: true,
    enum: ['mollie', 'paypal', 'stripe', 'square', 'razorpay', 'braintree'],
    lowercase: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  isActive: {
    type: Boolean,
    default: false
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isRecommended: {
    type: Boolean,
    default: false
  },
  configuration: {
    // Mollie configuration
    mollieApiKey: {
      type: String,
      select: false // Don't include in regular queries for security
    },
    mollieTestMode: {
      type: Boolean,
      default: true
    },
    
    // PayPal configuration
    paypalClientId: {
      type: String,
      select: false
    },
    paypalClientSecret: {
      type: String,
      select: false
    },
    paypalSandbox: {
      type: Boolean,
      default: true
    },
    
    // Stripe configuration
    stripePublishableKey: {
      type: String,
      select: false
    },
    stripeSecretKey: {
      type: String,
      select: false
    },
    stripeTestMode: {
      type: Boolean,
      default: true
    },
    
    // Generic webhook configuration
    webhookUrl: String,
    webhookSecret: {
      type: String,
      select: false
    },
    
    // Additional provider-specific settings
    additionalSettings: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  supportedCurrencies: [{
    type: String,
    uppercase: true,
    default: ['EUR', 'USD']
  }],
  supportedPaymentMethods: [{
    type: String,
    enum: [
      'credit_card', 'debit_card', 'bank_transfer', 'paypal', 
      'apple_pay', 'google_pay', 'ideal', 'sofort', 'bancontact',
      'giropay', 'eps', 'przelewy24', 'blik', 'klarna'
    ]
  }],
  fees: {
    fixedFee: {
      type: Number,
      default: 0,
      min: 0
    },
    percentageFee: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    currency: {
      type: String,
      default: 'EUR',
      uppercase: true
    }
  },
  limits: {
    minAmount: {
      type: Number,
      default: 0.01,
      min: 0
    },
    maxAmount: {
      type: Number,
      default: 10000,
      min: 0
    },
    currency: {
      type: String,
      default: 'EUR',
      uppercase: true
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'testing', 'maintenance'],
    default: 'inactive'
  },
  lastTestedAt: Date,
  testResults: {
    success: Boolean,
    message: String,
    testedAt: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Indexes
paymentGatewaySchema.index({ provider: 1 })
paymentGatewaySchema.index({ isActive: 1 })
paymentGatewaySchema.index({ isDefault: 1 })
paymentGatewaySchema.index({ status: 1 })
paymentGatewaySchema.index({ priority: -1 }) // Higher priority first
paymentGatewaySchema.index({ isActive: 1, priority: -1 }) // Compound index for active gateways ordered by priority
paymentGatewaySchema.index({ isRecommended: 1 }) // Index for recommended gateways

// Ensure only one default gateway
paymentGatewaySchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } },
      { isDefault: false }
    )
  }
  next()
})

// Virtual for masked API keys (for display purposes)
paymentGatewaySchema.virtual('maskedConfiguration').get(function() {
  const config = this.configuration.toObject()
  
  // Mask sensitive fields
  if (config.mollieApiKey) {
    config.mollieApiKey = config.mollieApiKey.replace(/(.{4}).*(.{4})/, '$1****$2')
  }
  if (config.paypalClientSecret) {
    config.paypalClientSecret = config.paypalClientSecret.replace(/(.{4}).*(.{4})/, '$1****$2')
  }
  if (config.stripeSecretKey) {
    config.stripeSecretKey = config.stripeSecretKey.replace(/(.{4}).*(.{4})/, '$1****$2')
  }
  if (config.webhookSecret) {
    config.webhookSecret = '****'
  }
  
  return config
})

// Method to get provider-specific configuration
paymentGatewaySchema.methods.getProviderConfig = function() {
  const config = {}
  
  switch (this.provider) {
    case 'mollie':
      config.apiKey = this.configuration.mollieApiKey
      config.testMode = this.configuration.mollieTestMode
      break
    case 'paypal':
      config.clientId = this.configuration.paypalClientId
      config.clientSecret = this.configuration.paypalClientSecret
      config.sandbox = this.configuration.paypalSandbox
      break
    case 'stripe':
      config.publishableKey = this.configuration.stripePublishableKey
      config.secretKey = this.configuration.stripeSecretKey
      config.testMode = this.configuration.stripeTestMode
      break
  }
  
  config.webhookUrl = this.configuration.webhookUrl
  config.webhookSecret = this.configuration.webhookSecret
  config.additionalSettings = this.configuration.additionalSettings
  
  return config
}

// Static method to get active gateway
paymentGatewaySchema.statics.getActiveGateway = function() {
  return this.findOne({ isActive: true, status: 'active' })
}

// Static method to get default gateway
paymentGatewaySchema.statics.getDefaultGateway = function() {
  return this.findOne({ isDefault: true })
}

export default mongoose.models.PaymentGateway || mongoose.model('PaymentGateway', paymentGatewaySchema) 