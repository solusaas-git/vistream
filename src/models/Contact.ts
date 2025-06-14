import mongoose, { Schema, Document } from 'mongoose'

export interface IContact extends Document {
  name: string
  email: string
  subject: string
  message: string
  status: 'new' | 'read' | 'replied' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignedTo?: mongoose.Types.ObjectId
  tags: string[]
  notes: string[]
  ipAddress?: string
  userAgent?: string
  source: string
  createdAt: Date
  updatedAt: Date
  repliedAt?: Date
  closedAt?: Date
}

const ContactSchema = new Schema<IContact>({
  name: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Veuillez entrer un email valide']
  },
  subject: {
    type: String,
    required: [true, 'L\'objet est requis'],
    trim: true,
    maxlength: [200, 'L\'objet ne peut pas dépasser 200 caractères']
  },
  message: {
    type: String,
    required: [true, 'Le message est requis'],
    trim: true,
    maxlength: [5000, 'Le message ne peut pas dépasser 5000 caractères']
  },
  status: {
    type: String,
    enum: ['new', 'read', 'replied', 'closed'],
    default: 'new',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Un tag ne peut pas dépasser 50 caractères']
  }],
  notes: [{
    content: {
      type: String,
      required: true,
      maxlength: [1000, 'Une note ne peut pas dépasser 1000 caractères']
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    default: 'landing_page',
    trim: true
  },
  repliedAt: {
    type: Date
  },
  closedAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Indexes for better query performance
ContactSchema.index({ status: 1, createdAt: -1 })
ContactSchema.index({ email: 1 })
ContactSchema.index({ assignedTo: 1, status: 1 })
ContactSchema.index({ priority: 1, status: 1 })
ContactSchema.index({ tags: 1 })
ContactSchema.index({ createdAt: -1 })

// Virtual for response time calculation
ContactSchema.virtual('responseTime').get(function() {
  if (this.repliedAt && this.createdAt) {
    return this.repliedAt.getTime() - this.createdAt.getTime()
  }
  return null
})

// Pre-save middleware to update timestamps
ContactSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'replied' && !this.repliedAt) {
      this.repliedAt = new Date()
    }
    if (this.status === 'closed' && !this.closedAt) {
      this.closedAt = new Date()
    }
  }
  next()
})

// Transform output
ContactSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret._id = ret._id.toString()
    if (ret.assignedTo) {
      ret.assignedTo = ret.assignedTo.toString()
    }
    return ret
  }
})

export default mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema) 