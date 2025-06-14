import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectToDatabase from '@/lib/mongoose'
import User from '@/models/User'
import { sendPasswordResetEmail } from '@/lib/email'

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Veuillez entrer une adresse email valide."),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = forgotPasswordSchema.parse(body)
    
    // Connect to database
    await connectToDatabase()
    
    // Find user by email
    const user = await User.findOne({ 
      email: validatedData.email,
      isVerified: true 
    }).select('+resetToken +resetTokenExpiry')
    
    // Always return success for security (don't reveal if email exists)
    if (!user) {
      return NextResponse.json({
        message: 'Si cette adresse email existe, vous recevrez un lien de réinitialisation.',
      }, { status: 200 })
    }

    // Sécurité : Vérifier si un token récent existe déjà (moins de 5 minutes)
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
    if (user.resetTokenExpiry && user.resetTokenExpiry.getTime() > fiveMinutesAgo) {
      return NextResponse.json({
        message: 'Un email de réinitialisation a déjà été envoyé récemment. Veuillez patienter 5 minutes avant de faire une nouvelle demande.',
      }, { status: 429 })
    }
    
    // Generate reset token
    const resetToken = user.generateResetToken()
    
    // Save user with reset token
    await user.save()
    
    console.log('Password reset requested for:', user.email)
    
    // Send password reset email
    const emailSent = await sendPasswordResetEmail(
      validatedData.email,
      resetToken,
      user.firstName
    )
    
    if (!emailSent) {
      console.error('Failed to send password reset email')
      // Still return success for security
    }
    
    return NextResponse.json({
      message: 'Si cette adresse email existe, vous recevrez un lien de réinitialisation.',
    }, { status: 200 })
    
  } catch (error) {
    console.error('Forgot password error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides.', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    )
  }
} 