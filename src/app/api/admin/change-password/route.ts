import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongoose'
import User from '@/models/User'
import { verifyToken } from '@/lib/auth'
import bcrypt from 'bcryptjs'

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

    // Get password data from request body
    const { currentPassword, newPassword } = await request.json()

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Mot de passe actuel et nouveau mot de passe requis' },
        { status: 400 }
      )
    }

    // Validate new password length
    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      )
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Mot de passe actuel incorrect' },
        { status: 400 }
      )
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password)
    if (isSamePassword) {
      return NextResponse.json(
        { success: false, message: 'Le nouveau mot de passe doit être différent de l\'ancien' },
        { status: 400 }
      )
    }

    // Hash new password
    const saltRounds = 12
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update user password
    const updatedUser = await User.findByIdAndUpdate(
      decoded.userId,
      {
        password: hashedNewPassword,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    )

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    })

  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json(
      { success: false, message: 'Erreur serveur lors du changement de mot de passe' },
      { status: 500 }
    )
  }
} 