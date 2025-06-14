import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongoose'
import User from '@/models/User'
import { verifyToken } from '@/lib/auth'

export async function PUT(request: NextRequest) {
  try {
    await connectDB()

    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token manquant' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Token invalide' },
        { status: 401 }
      )
    }

    // Check if user exists and has valid role
    const user = await User.findById(decoded.userId)
    if (!user || !['admin', 'user', 'customer'].includes(user.role)) {
      return NextResponse.json(
        { success: false, message: 'Accès refusé' },
        { status: 403 }
      )
    }

    // Get update data from request body
    const { firstName, lastName, email, phonePrefix, phoneNumber } = await request.json()

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { success: false, message: 'Prénom, nom et email sont requis' },
        { status: 400 }
      )
    }

    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } })
      if (existingUser) {
        return NextResponse.json(
          { success: false, message: 'Cette adresse email est déjà utilisée' },
          { status: 400 }
        )
      }
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      {
        firstName,
        lastName,
        email,
        phonePrefix: phonePrefix || '+33',
        phoneNumber: phoneNumber || '',
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password')

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: {
        userId: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phonePrefix: updatedUser.phonePrefix,
        phoneNumber: updatedUser.phoneNumber,
        role: updatedUser.role,
        isVerified: updatedUser.isVerified,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur serveur lors de la mise à jour du profil' },
      { status: 500 }
    )
  }
} 