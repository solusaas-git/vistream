import mongoose, { Schema, Document } from 'mongoose'

export interface IMarketingAttribution extends Document {
  userId?: string
  email?: string
  planId: string
  planName: string
  planPrice: string
  planPeriod: string
  // Paramètres UTM
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  // Paramètres personnalisés
  referrer?: string
  campaignId?: string
  affiliateId?: string
  promoCode?: string
  // Métadonnées
  userAgent?: string
  ipAddress?: string
  timestamp: Date
  conversionType: 'signup_started' | 'signup_completed' | 'subscription_created' | 'payment_completed'
  conversionValue: number
  createdAt: Date
  updatedAt: Date
}

const MarketingAttributionSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  email: {
    type: String,
    required: false,
    trim: true,
    lowercase: true
  },
  planId: {
    type: String,
    required: true,
    index: true
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
  // Paramètres UTM
  utmSource: {
    type: String,
    trim: true,
    index: true
  },
  utmMedium: {
    type: String,
    trim: true,
    index: true
  },
  utmCampaign: {
    type: String,
    trim: true,
    index: true
  },
  utmContent: {
    type: String,
    trim: true
  },
  utmTerm: {
    type: String,
    trim: true
  },
  // Paramètres personnalisés
  referrer: {
    type: String,
    trim: true
  },
  campaignId: {
    type: String,
    trim: true,
    index: true
  },
  affiliateId: {
    type: String,
    trim: true,
    index: true
  },
  promoCode: {
    type: String,
    trim: true,
    index: true
  },
  // Métadonnées
  userAgent: {
    type: String
  },
  ipAddress: {
    type: String,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  conversionType: {
    type: String,
    enum: ['signup_started', 'signup_completed', 'subscription_created', 'payment_completed'],
    default: 'signup_started',
    index: true
  },
  conversionValue: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
})

// Index composés pour les requêtes de performance
MarketingAttributionSchema.index({ utmSource: 1, utmCampaign: 1 })
MarketingAttributionSchema.index({ planId: 1, conversionType: 1 })
MarketingAttributionSchema.index({ createdAt: -1 })
MarketingAttributionSchema.index({ timestamp: -1 })

// Index pour les requêtes de reporting
MarketingAttributionSchema.index({ 
  utmSource: 1, 
  utmMedium: 1, 
  utmCampaign: 1, 
  createdAt: -1 
})

const MarketingAttribution = mongoose.models.MarketingAttribution || 
  mongoose.model<IMarketingAttribution>('MarketingAttribution', MarketingAttributionSchema)

export default MarketingAttribution 