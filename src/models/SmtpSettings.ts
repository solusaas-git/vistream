import mongoose, { Schema, Document } from 'mongoose'

export interface ISmtpSettings extends Document {
  name: string
  host: string
  port: number
  secure: boolean
  username: string
  password: string
  fromEmail: string
  fromName: string
  isActive: boolean
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

const SmtpSettingsSchema = new Schema<ISmtpSettings>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  host: {
    type: String,
    required: true,
    trim: true
  },
  port: {
    type: Number,
    required: true,
    min: 1,
    max: 65535
  },
  secure: {
    type: Boolean,
    default: true
  },
  username: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  fromEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  fromName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  isActive: {
    type: Boolean,
    default: false
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Index pour la performance
SmtpSettingsSchema.index({ isActive: 1 })
SmtpSettingsSchema.index({ isDefault: 1 })
SmtpSettingsSchema.index({ createdAt: -1 })

// Middleware pour s'assurer qu'il n'y a qu'un seul SMTP par défaut
SmtpSettingsSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    // Désactiver tous les autres SMTP par défaut
    await mongoose.model('SmtpSettings').updateMany(
      { _id: { $ne: this._id } },
      { $set: { isDefault: false } }
    )
  }
  
  if (this.isActive && this.isModified('isActive')) {
    // Désactiver tous les autres SMTP actifs
    await mongoose.model('SmtpSettings').updateMany(
      { _id: { $ne: this._id } },
      { $set: { isActive: false } }
    )
  }
  
  next()
})

export default mongoose.models.SmtpSettings || mongoose.model<ISmtpSettings>('SmtpSettings', SmtpSettingsSchema) 