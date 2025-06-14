import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectToDatabase from '@/lib/mongoose'
import User, { UserRole } from '@/models/User'
import { withAdmin } from '@/lib/rbac'
import { rateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit'

// Validation schema for updating users
const updateUserSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères.").max(50).optional(),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères.").max(50).optional(),
  email: z.string().email("Veuillez entrer une adresse email valide.").optional(),
  phonePrefix: z.string().regex(/^\+\d{1,4}$/, "Préfixe téléphonique invalide.").optional(),
  phoneNumber: z.string().min(8, "Le numéro doit contenir au moins 8 chiffres.").max(15).regex(/^\d+$/, "Le numéro ne doit contenir que des chiffres.").optional(),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères.").optional(),
  role: z.enum(['admin', 'user', 'customer']).optional(),
  isVerified: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/admin/users/[id] - Get user details
export const GET = withAdmin(async (request: NextRequest, user, { params }: RouteParams) => {
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

    const { id } = await params
    
    // Import Subscription model
    const Subscription = (await import('@/models/Subscription')).default
    
    // Get user with subscription data
    const targetUser = await User.findById(id)
      .select('-password -otp -otpExpiry -resetToken -resetTokenExpiry')
      .lean()

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé.' },
        { status: 404 }
      )
    }

    // Get user's subscription
    const subscription = await Subscription.findOne({ 
      userId: id,
      status: 'active'
    }).lean()

    // Add subscription to user data
    const userWithSubscription = {
      ...targetUser,
      subscription: subscription || null
    }

    return NextResponse.json({
      success: true,
      data: userWithSubscription
    })

  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'utilisateur.' },
      { status: 500 }
    )
  }
})

// PUT /api/admin/users/[id] - Update user
export const PUT = withAdmin(async (request: NextRequest, user, { params }: RouteParams) => {
  try {
    // Apply rate limiting (bypassed for admin users)
    const rateLimitResult = rateLimit(request, rateLimitConfigs.default, user)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitResponse(rateLimitResult.resetTime),
        { status: 429 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const validatedData = updateUserSchema.parse(body)
    
    await connectToDatabase()
    
    const { id } = await params
    // Check if user exists
    const targetUser = await User.findById(id)
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé.' },
        { status: 404 }
      )
    }

    // Prevent admin from deactivating themselves
    if (id === user.userId && validatedData.isActive === false) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas désactiver votre propre compte.' },
        { status: 400 }
      )
    }

    // Prevent admin from changing their own role
    if (id === user.userId && validatedData.role && validatedData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas modifier votre propre rôle.' },
        { status: 400 }
      )
    }

    // Check if email is already taken by another user
    if (validatedData.email && validatedData.email !== targetUser.email) {
      const existingUser = await User.findOne({ 
        email: validatedData.email,
        _id: { $ne: id }
      })
      if (existingUser) {
        return NextResponse.json(
          { error: 'Cette adresse email est déjà utilisée.' },
          { status: 400 }
        )
      }
    }
    
    // Prepare update data
    const updateData = { ...validatedData }
    
    // Handle password update separately if provided
    if (validatedData.password && validatedData.password.trim() !== '') {
      // Remove password from updateData as it will be handled by pre-save middleware
      delete updateData.password
      
      // Update user with password (triggers pre-save middleware for hashing)
      const userToUpdate = await User.findById(id)
      if (userToUpdate) {
        Object.assign(userToUpdate, updateData)
        userToUpdate.password = validatedData.password
        await userToUpdate.save()
        
        // Get updated user without sensitive data
        const updatedUser = await User.findById(id)
          .select('-password -otp -otpExpiry -resetToken -resetTokenExpiry')
        
        return NextResponse.json({
          success: true,
          message: 'Utilisateur mis à jour avec succès.',
          data: { user: updatedUser }
        })
      }
    }
    
    // Update user without password
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -otp -otpExpiry -resetToken -resetTokenExpiry')
    
    return NextResponse.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès.',
      data: { user: updatedUser }
    })
    
  } catch (error) {
    console.error('Error updating user:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Données invalides.', 
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }
    
    // Handle MongoDB duplicate key error
    if ((error as any).code === 11000) {
      return NextResponse.json(
        { error: 'Cette adresse email est déjà utilisée.' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de l\'utilisateur.' },
      { status: 500 }
    )
  }
})

// DELETE /api/admin/users/[id] - Delete user (soft delete by setting isActive to false)
export const DELETE = withAdmin(async (request: NextRequest, user, { params }: RouteParams) => {
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

    const { id } = await params
    // Check if user exists
    const targetUser = await User.findById(id)
    if (!targetUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé.' },
        { status: 404 }
      )
    }

    // Prevent admin from deleting themselves
    if (id === user.userId) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas supprimer votre propre compte.' },
        { status: 400 }
      )
    }

    // Soft delete by setting isActive to false
    await User.findByIdAndUpdate(id, { isActive: false })

    return NextResponse.json({
      success: true,
      message: 'Utilisateur supprimé avec succès.'
    })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de l\'utilisateur.' },
      { status: 500 }
    )
  }
}) 