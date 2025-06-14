import mongoose, { Document, Schema } from 'mongoose'
import bcrypt from 'bcryptjs'

export type UserRole = 'admin' | 'user' | 'customer'

export interface IUser extends Document {
  _id: string
  email: string
  firstName: string
  lastName: string
  phonePrefix: string
  phoneNumber: string
  password: string
  role: UserRole
  isVerified: boolean
  isActive: boolean
  affiliationCode?: string
  otp?: string
  otpExpiry?: Date
  resetToken?: string
  resetTokenExpiry?: Date
  lastLogin?: Date
  loginAttempts: number
  lockUntil?: Date
  createdAt: Date
  updatedAt: Date
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>
  generateOTP(): string
  generateResetToken(): string
  generateAffiliationCode(): string
  isAccountLocked(): boolean
  incLoginAttempts(): Promise<IUser>
  hasRole(role: UserRole): boolean
  canAccess(requiredRole: UserRole): boolean
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    minlength: [2, 'First name must be at least 2 characters'],
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    minlength: [2, 'Last name must be at least 2 characters'],
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  phonePrefix: {
    type: String,
    required: [true, 'Phone prefix is required'],
    match: [/^\+\d{1,4}$/, 'Please enter a valid phone prefix']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    minlength: [8, 'Phone number must be at least 8 digits'],
    maxlength: [15, 'Phone number cannot exceed 15 digits'],
    match: [/^\d+$/, 'Phone number must contain only digits']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'customer'],
    default: 'customer',
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  affiliationCode: {
    type: String,
    unique: true,
    sparse: true, // Permet les valeurs null/undefined multiples
    match: [/^\d{4}$/, 'Affiliation code must be exactly 4 digits']
  },
  otp: {
    type: String,
    select: false
  },
  otpExpiry: {
    type: Date,
    select: false
  },
  resetToken: {
    type: String,
    select: false
  },
  resetTokenExpiry: {
    type: Date,
    select: false
  },
  lastLogin: {
    type: Date
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password
      delete ret.otp
      delete ret.otpExpiry
      delete ret.resetToken
      delete ret.resetTokenExpiry
      delete ret.__v
      return ret
    }
  }
})

// Indexes for performance
UserSchema.index({ role: 1 })
UserSchema.index({ isVerified: 1 })
UserSchema.index({ isActive: 1 })
UserSchema.index({ resetToken: 1 })
UserSchema.index({ otpExpiry: 1 })
UserSchema.index({ resetTokenExpiry: 1 })
UserSchema.index({ role: 1, isActive: 1 })
UserSchema.index({ createdAt: -1 })

// Pre-save middleware to generate affiliation code for users
UserSchema.pre('save', async function(next) {
  // Generate affiliation code for users (not customers or admins)
  if (this.isNew && this.role === 'user' && !this.affiliationCode) {
    let code: string
    let isUnique = false
    let attempts = 0
    const maxAttempts = 20
    
    // Function to generate easy-to-remember codes
    const generateEasyCode = (): string => {
      const patterns = [
        // Pattern 1: AABB (1122, 3344, etc.)
        () => {
          const digit = Math.floor(Math.random() * 9) + 1 // 1-9
          return `${digit}${digit}${digit}${digit}`
        },
        // Pattern 2: ABAB (1212, 3434, etc.)
        () => {
          const a = Math.floor(Math.random() * 9) + 1 // 1-9
          const b = Math.floor(Math.random() * 9) + 1 // 1-9
          return a !== b ? `${a}${b}${a}${b}` : `${a}${a + 1}${a}${a + 1}`
        },
        // Pattern 3: Sequential (1234, 2345, etc.)
        () => {
          const start = Math.floor(Math.random() * 6) + 1 // 1-6
          return `${start}${start + 1}${start + 2}${start + 3}`
        },
        // Pattern 4: Reverse sequential (4321, 5432, etc.)
        () => {
          const start = Math.floor(Math.random() * 6) + 4 // 4-9
          return `${start}${start - 1}${start - 2}${start - 3}`
        },
        // Pattern 5: Year-like (2024, 2025, etc.)
        () => {
          const year = Math.floor(Math.random() * 10) + 2020 // 2020-2029
          return year.toString()
        },
        // Pattern 6: Round numbers (1000, 2000, 3000, etc.)
        () => {
          const base = Math.floor(Math.random() * 9) + 1 // 1-9
          return `${base}000`
        },
        // Pattern 7: ABBA (1221, 3443, etc.)
        () => {
          const a = Math.floor(Math.random() * 9) + 1 // 1-9
          const b = Math.floor(Math.random() * 9) + 1 // 1-9
          return a !== b ? `${a}${b}${b}${a}` : `${a}${a + 1}${a + 1}${a}`
        }
      ]
      
      const pattern = patterns[Math.floor(Math.random() * patterns.length)]
      return pattern()
    }
    
    while (!isUnique && attempts < maxAttempts) {
      // 70% chance for easy pattern, 30% chance for random
      if (Math.random() < 0.7) {
        code = generateEasyCode()
      } else {
        // Fallback to random 4-digit code
        code = Math.floor(1000 + Math.random() * 9000).toString()
      }
      
      // Avoid very simple codes like 1111, 0000, etc.
      const isSimple = /^(\d)\1{3}$/.test(code) || code === '0000' || code === '1234' || code === '4321'
      
      if (!isSimple) {
        const existingUser = await mongoose.model('User').findOne({ affiliationCode: code })
        if (!existingUser) {
          this.affiliationCode = code
          isUnique = true
        }
      }
      attempts++
    }
    
    if (!isUnique) {
      return next(new Error('Unable to generate unique affiliation code'))
    }
  }
  
  next()
})

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error as Error)
  }
})

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    throw new Error('Password comparison failed')
  }
}

// Method to generate OTP
UserSchema.methods.generateOTP = function(): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  this.otp = otp
  this.otpExpiry = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  return otp
}

// Method to generate reset token
UserSchema.methods.generateResetToken = function(): string {
  const crypto = require('crypto')
  
  // Générer un token aléatoire
  const resetToken = crypto.randomBytes(32).toString('hex')
  
  // Hasher le token avant de le stocker
  this.resetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
  this.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
  
  // Retourner le token non hashé (pour l'email)
  return resetToken
}

// Method to generate affiliation code
UserSchema.methods.generateAffiliationCode = async function(): Promise<string> {
  if (this.role !== 'user') {
    throw new Error('Only users can have affiliation codes')
  }
  
  let code: string
  let isUnique = false
  let attempts = 0
  const maxAttempts = 20
  
  // Function to generate easy-to-remember codes
  const generateEasyCode = (): string => {
    const patterns = [
      // Pattern 1: AABB (1122, 3344, etc.)
      () => {
        const digit = Math.floor(Math.random() * 9) + 1 // 1-9
        return `${digit}${digit}${digit}${digit}`
      },
      // Pattern 2: ABAB (1212, 3434, etc.)
      () => {
        const a = Math.floor(Math.random() * 9) + 1 // 1-9
        const b = Math.floor(Math.random() * 9) + 1 // 1-9
        return a !== b ? `${a}${b}${a}${b}` : `${a}${a + 1}${a}${a + 1}`
      },
      // Pattern 3: Sequential (1234, 2345, etc.)
      () => {
        const start = Math.floor(Math.random() * 6) + 1 // 1-6
        return `${start}${start + 1}${start + 2}${start + 3}`
      },
      // Pattern 4: Reverse sequential (4321, 5432, etc.)
      () => {
        const start = Math.floor(Math.random() * 6) + 4 // 4-9
        return `${start}${start - 1}${start - 2}${start - 3}`
      },
      // Pattern 5: Year-like (2024, 2025, etc.)
      () => {
        const year = Math.floor(Math.random() * 10) + 2020 // 2020-2029
        return year.toString()
      },
      // Pattern 6: Round numbers (1000, 2000, 3000, etc.)
      () => {
        const base = Math.floor(Math.random() * 9) + 1 // 1-9
        return `${base}000`
      },
      // Pattern 7: ABBA (1221, 3443, etc.)
      () => {
        const a = Math.floor(Math.random() * 9) + 1 // 1-9
        const b = Math.floor(Math.random() * 9) + 1 // 1-9
        return a !== b ? `${a}${b}${b}${a}` : `${a}${a + 1}${a + 1}${a}`
      }
    ]
    
    const pattern = patterns[Math.floor(Math.random() * patterns.length)]
    return pattern()
  }
  
  while (!isUnique && attempts < maxAttempts) {
    // 70% chance for easy pattern, 30% chance for random
    if (Math.random() < 0.7) {
      code = generateEasyCode()
    } else {
      // Fallback to random 4-digit code
      code = Math.floor(1000 + Math.random() * 9000).toString()
    }
    
    // Avoid very simple codes like 1111, 0000, etc.
    const isSimple = /^(\d)\1{3}$/.test(code) || code === '0000' || code === '1234' || code === '4321'
    
    if (!isSimple) {
      const existingUser = await mongoose.model('User').findOne({ affiliationCode: code })
      if (!existingUser) {
        this.affiliationCode = code
        isUnique = true
      }
    }
    attempts++
  }
  
  if (!isUnique) {
    throw new Error('Unable to generate unique affiliation code')
  }
  
  await this.save()
  return this.affiliationCode!
}

// Method to check if account is locked
UserSchema.methods.isAccountLocked = function(): boolean {
  return !!(this.lockUntil && this.lockUntil.getTime() > Date.now())
}

// Method to increment login attempts
UserSchema.methods.incLoginAttempts = async function(): Promise<IUser> {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil.getTime() < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    })
  }
  
  const updates: any = { $inc: { loginAttempts: 1 } }
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isAccountLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 } // 2 hours
  }
  
  return this.updateOne(updates)
}

// Method to check if user has specific role
UserSchema.methods.hasRole = function(role: UserRole): boolean {
  return this.role === role
}

// Method to check if user can access a resource (role hierarchy)
UserSchema.methods.canAccess = function(requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    'customer': 1,
    'user': 2,
    'admin': 3
  }
  
  const userLevel = roleHierarchy[this.role as UserRole]
  const requiredLevel = roleHierarchy[requiredRole]
  
  return userLevel >= requiredLevel
}

// Static method to find by credentials
UserSchema.statics.findByCredentials = async function(email: string, password: string) {
  const user = await this.findOne({ email }).select('+password +loginAttempts +lockUntil')
  
  if (!user) {
    throw new Error('Invalid credentials')
  }
  
  // Check if account is locked
  if (user.isAccountLocked()) {
    throw new Error('Account temporarily locked due to too many failed login attempts')
  }
  
  const isMatch = await user.comparePassword(password)
  
  if (!isMatch) {
    await user.incLoginAttempts()
    throw new Error('Invalid credentials')
  }
  
  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    await user.updateOne({
      $unset: { loginAttempts: 1, lockUntil: 1 },
      $set: { lastLogin: new Date() }
    })
  } else {
    await user.updateOne({ $set: { lastLogin: new Date() } })
  }
  
  return user
}

// Create and export the model
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

export default User 