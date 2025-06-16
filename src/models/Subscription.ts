import mongoose, { Schema, Document } from 'mongoose'

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId
  planId: string
  planName: string
  planPrice: string
  planPeriod: string
  status: 'active' | 'inactive' | 'cancelled' | 'expired' | 'pending'
  startDate: Date
  endDate?: Date
  autoRenew: boolean
  // Affiliation tracking
  affiliationCode?: string
  affiliatedUserId?: mongoose.Types.ObjectId
  saleValue: number
  createdAt: Date
  updatedAt: Date
  calculateEndDate(): Date
}

const SubscriptionSchema = new Schema<ISubscription>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  planId: {
    type: String,
    required: true
  },
  planName: {
    type: String,
    required: true,
    trim: true
  },
  planPrice: {
    type: String,
    required: true
  },
  planPeriod: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'expired', 'pending'],
    default: 'active',
    index: true
  },
  startDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  endDate: {
    type: Date
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  // Affiliation tracking
  affiliationCode: {
    type: String,
    match: [/^\d{4}$/, 'Affiliation code must be exactly 4 digits']
  },
  affiliatedUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  saleValue: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
})

// Indexes for better query performance
SubscriptionSchema.index({ userId: 1, status: 1 })
SubscriptionSchema.index({ planId: 1 })
SubscriptionSchema.index({ createdAt: -1 })
SubscriptionSchema.index({ affiliationCode: 1 })
SubscriptionSchema.index({ affiliatedUserId: 1 })
SubscriptionSchema.index({ affiliatedUserId: 1, createdAt: -1 })

// Virtual for subscription duration
SubscriptionSchema.virtual('isActive').get(function() {
  return this.status === 'active' && (!this.endDate || this.endDate > new Date())
})

// Method to calculate end date based on period
SubscriptionSchema.methods.calculateEndDate = function(): Date {
  const startDate = this.startDate || new Date()
  const endDate = new Date(startDate)
  
  if (this.planPeriod.includes('mois')) {
    const months = parseInt(this.planPeriod) || 1
    endDate.setMonth(endDate.getMonth() + months)
  } else if (this.planPeriod.includes('an') || this.planPeriod.includes('year')) {
    const years = parseInt(this.planPeriod) || 1
    endDate.setFullYear(endDate.getFullYear() + years)
  } else {
    // Default to 1 month if period is unclear
    endDate.setMonth(endDate.getMonth() + 1)
  }
  
  return endDate
}

// Pre-save middleware to set end date
SubscriptionSchema.pre('save', function(next) {
  if (this.isNew && !this.endDate) {
    this.endDate = this.calculateEndDate()
  }
  next()
})

// Force delete the model from cache to ensure schema updates
if (mongoose.models.Subscription) {
  delete mongoose.models.Subscription
}

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema) 