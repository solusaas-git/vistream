import mongoose, { Schema, Document } from 'mongoose'

export interface IPlan extends Document {
  name: string
  description: string
  price: string
  period: string
  highlight: boolean
  features: string[]
  isActive: boolean
  order: number
  slug: string
  createdAt: Date
  updatedAt: Date
}

const PlanSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Le nom du plan est requis'],
    trim: true,
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    trim: true,
    maxlength: [200, 'La description ne peut pas dépasser 200 caractères']
  },
  price: {
    type: String,
    required: [true, 'Le prix est requis'],
    trim: true
  },
  period: {
    type: String,
    required: [true, 'La période est requise'],
    trim: true
  },
  highlight: {
    type: Boolean,
    default: false
  },
  features: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    required: [true, 'L\'ordre est requis'],
    min: [1, 'L\'ordre doit être supérieur à 0']
  },
  slug: {
    type: String,
    required: true,
    unique: true
  }
}, {
  timestamps: true
})

// Index for ordering
PlanSchema.index({ order: 1 })
PlanSchema.index({ isActive: 1 })

// Function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[àáâäãåā]/g, 'a')
    .replace(/[èéêëē]/g, 'e')
    .replace(/[ìíîïī]/g, 'i')
    .replace(/[òóôöõøō]/g, 'o')
    .replace(/[ùúûüū]/g, 'u')
    .replace(/[ñń]/g, 'n')
    .replace(/[çć]/g, 'c')
    .replace(/[ß]/g, 'ss')
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

// Pre-save middleware to generate slug
PlanSchema.pre('save', async function(next) {
  // Generate slug if it's a new document or name has changed
  if (this.isNew || this.isModified('name')) {
    let baseSlug = generateSlug(this.name as string)
    let slug = baseSlug
    let counter = 1
    
    // Check for existing slugs and make unique
    while (await mongoose.model('Plan').findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }
    
    this.slug = slug
  }
  
  // Ensure only one plan can be highlighted at a time
  if (this.highlight && this.isModified('highlight')) {
    // Remove highlight from other plans
    await mongoose.model('Plan').updateMany(
      { _id: { $ne: this._id } },
      { highlight: false }
    )
  }
  next()
})

// Transform output
PlanSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret._id = ret._id.toString()
    return ret
  }
})

export default mongoose.models.Plan || mongoose.model<IPlan>('Plan', PlanSchema) 