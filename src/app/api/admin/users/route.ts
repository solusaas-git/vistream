import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectToDatabase from '@/lib/mongoose'
import User, { UserRole } from '@/models/User'
import Subscription from '@/models/Subscription'
import { withAuth } from '@/lib/rbac'
import { rateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit'

// Validation schema for creating users
const createUserSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères.").max(50),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères.").max(50),
  email: z.string().email("Veuillez entrer une adresse email valide."),
  phonePrefix: z.string().regex(/^\+\d{1,4}$/, "Préfixe téléphonique invalide."),
  phoneNumber: z.string().min(8, "Le numéro doit contenir au moins 8 chiffres.").max(15).regex(/^\d+$/, "Le numéro ne doit contenir que des chiffres."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  role: z.enum(['admin', 'user', 'customer']),
  isVerified: z.boolean(),
  isActive: z.boolean(),
})

// GET /api/admin/users - List users with pagination and filtering
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    // Apply rate limiting (bypassed for admin users)
    const rateLimitResult = rateLimit(request, rateLimitConfigs.default, user)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitResponse(rateLimitResult.resetTime),
        { status: 429 }
      )
    }

    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') as UserRole | null
    const isActive = searchParams.get('isActive')
    const isVerified = searchParams.get('isVerified')

    // Build filter query based on user role
    const filter: any = {}
    
    // Role-based filtering
    if (user.role === 'admin') {
      // Admins can see ALL users without any affiliation restriction
      // Simply apply role filter if specified
      if (role) {
        filter.role = role
      }

    } else if (user.role === 'user') {
      // Users with affiliation codes can only see customers they are affiliated with
      // Find subscriptions where this user is the affiliated user
      const affiliatedSubscriptions = await Subscription.find({ 
        affiliatedUserId: user.userId 
      }).select('userId').lean()
      
      const affiliatedUserIds = affiliatedSubscriptions.map(sub => sub.userId)
      
      if (affiliatedUserIds.length === 0) {
        // No affiliated customers found, show empty result for users
        return NextResponse.json({
          success: true,
          data: {
            users: [],
            pagination: {
              page,
              limit,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false
            }
          }
        })
      } else {
        filter._id = { $in: affiliatedUserIds }
        filter.role = 'customer' // Users can only see customers
      }
    } else {
      // Customers shouldn't access this endpoint
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      )
    }
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (isActive !== null) {
      filter.isActive = isActive === 'true'
    }
    
    if (isVerified !== null) {
      filter.isVerified = isVerified === 'true'
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get users with pagination
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -otp -otpExpiry -resetToken -resetTokenExpiry')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter)
    ])

    // Get subscription data for each user
    const userIds = users.map(user => user._id)
    const subscriptions = await Subscription.find({ 
      userId: { $in: userIds } 
    }).sort({ createdAt: -1 }).lean()

    // Create a map of user subscriptions (latest subscription per user)
    const subscriptionMap = new Map()
    subscriptions.forEach(sub => {
      if (!subscriptionMap.has(sub.userId.toString())) {
        subscriptionMap.set(sub.userId.toString(), sub)
      }
    })

    // Add subscription data to users
    const usersWithSubscriptions = users.map(user => ({
      ...user,
      subscription: subscriptionMap.get((user._id as any).toString()) || null
    }))

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithSubscriptions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des utilisateurs' },
      { status: 500 }
    )
  }
}, 'user') // Allow both user and admin roles

// POST /api/admin/users - Create new user
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    // Only admins can create users
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Seuls les administrateurs peuvent créer des utilisateurs' },
        { status: 403 }
      )
    }

    // Apply rate limiting (bypassed for admin users)
    const rateLimitResult = rateLimit(request, rateLimitConfigs.adminOperations, user)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitResponse(rateLimitResult.resetTime),
        { status: 429 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const validatedData = createUserSchema.parse(body)
    
    await connectToDatabase()
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: validatedData.email })
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Un utilisateur avec cette adresse email existe déjà.' },
        { status: 400 }
      )
    }
    
    // Create new user
    const newUser = new User({
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      phonePrefix: validatedData.phonePrefix,
      phoneNumber: validatedData.phoneNumber,
      password: validatedData.password, // Will be hashed by the model
      role: validatedData.role,
      isVerified: validatedData.isVerified,
      isActive: validatedData.isActive,
    })
    
    await newUser.save()
    
    // Remove sensitive data from response
    const userResponse = newUser.toObject()
    delete userResponse.password
    delete userResponse.otp
    delete userResponse.otpExpiry
    delete userResponse.resetToken
    delete userResponse.resetTokenExpiry
    
    return NextResponse.json({
      success: true,
      message: 'Utilisateur créé avec succès.',
      data: { user: userResponse }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating user:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Données invalides.', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création de l\'utilisateur.' },
      { status: 500 }
    )
  }
}, 'admin') // Only admins can create users 