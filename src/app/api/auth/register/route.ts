import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectToDatabase from '@/lib/mongoose'
import User from '@/models/User'
import Subscription from '@/models/Subscription'
import { generateToken, sanitizeUser } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/email'

// Validation schema
const registerSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères."),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  email: z.string().email("Veuillez entrer une adresse email valide."),
  phonePrefix: z.string().min(1, "Sélectionnez un indicatif pays."),
  phoneNumber: z.string().min(8, "Le numéro de téléphone doit contenir au moins 8 chiffres."),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  affiliationCode: z.string().regex(/^\d{4}$/, "Le code d'affiliation doit contenir exactement 4 chiffres.").optional().or(z.literal("")),
  selectedPlan: z.object({
    planId: z.string(),
    planName: z.string(),
    planPrice: z.string(),
    planPeriod: z.string()
  }).optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validatedData = registerSchema.parse(body)
    
    // Connect to database
    await connectToDatabase()
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: validatedData.email })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà.' },
        { status: 400 }
      )
    }
    
    // Validate affiliation code if provided
    let affiliatedUser = null
    if (validatedData.affiliationCode && validatedData.affiliationCode.trim() !== '') {
      affiliatedUser = await User.findOne({ 
        affiliationCode: validatedData.affiliationCode,
        role: 'user',
        isActive: true 
      })
      
      if (!affiliatedUser) {
        return NextResponse.json(
          { error: 'Code d\'affiliation invalide.' },
          { status: 400 }
        )
      }
    }
    
    // Create new user (auto-verified)
    const newUser = new User({
      email: validatedData.email,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      phonePrefix: validatedData.phonePrefix,
      phoneNumber: validatedData.phoneNumber,
      password: validatedData.password, // Will be hashed by pre-save middleware
      isVerified: true, // Auto-verify users
      role: 'customer', // Default role
    })
    
    // Save user to database
    await newUser.save()
    
    console.log('User created:', { 
      id: newUser._id, 
      email: newUser.email, 
      firstName: newUser.firstName 
    })

    // Create subscription if plan was selected
    let subscription = null
    if (validatedData.selectedPlan) {
      try {
        // Calculate sale value from plan price
        const saleValue = parseFloat(validatedData.selectedPlan.planPrice.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
        
        subscription = new Subscription({
          userId: newUser._id,
          planId: validatedData.selectedPlan.planId,
          planName: validatedData.selectedPlan.planName,
          planPrice: validatedData.selectedPlan.planPrice,
          planPeriod: validatedData.selectedPlan.planPeriod,
          status: 'pending', // Pending until payment is completed
          startDate: new Date(),
          autoRenew: true,
          // Affiliation tracking
          affiliationCode: validatedData.affiliationCode || undefined,
          affiliatedUserId: affiliatedUser ? affiliatedUser._id : undefined,
          saleValue: saleValue
        })
        
        await subscription.save()
        
        console.log('Subscription created:', {
          id: subscription._id,
          userId: newUser._id,
          planName: subscription.planName,
          affiliationCode: subscription.affiliationCode,
          affiliatedUserId: subscription.affiliatedUserId,
          saleValue: subscription.saleValue
        })
      } catch (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError)
        // Don't fail registration if subscription creation fails
        // We can handle this in the UI or retry later
      }
    }
    
    // Generate access token
    const tokenPayload = { userId: newUser._id.toString(), email: newUser.email }
    const accessToken = generateToken(tokenPayload)
    
    // Prepare response
    const response = NextResponse.json({
      message: 'Compte créé avec succès.',
      user: sanitizeUser(newUser),
      subscription: subscription ? {
        id: subscription._id,
        planName: subscription.planName,
        planPrice: subscription.planPrice,
        planPeriod: subscription.planPeriod,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate
      } : null,
      accessToken,
    }, { status: 201 })
    
    // Set HTTP-only cookie for token
    response.cookies.set('auth-token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 24 * 60 * 60, // 1 day
    })
    
    // Send welcome email asynchronously (don't block the response)
    const subscriptionData = subscription ? {
      planName: subscription.planName,
      planPrice: subscription.planPrice,
      planPeriod: subscription.planPeriod,
      startDate: subscription.startDate.toLocaleDateString('fr-FR'),
      endDate: subscription.endDate ? subscription.endDate.toLocaleDateString('fr-FR') : undefined
    } : undefined

    // Send email in background without blocking the response
    sendWelcomeEmail(
      validatedData.email, 
      validatedData.firstName, 
      validatedData.lastName,
      subscriptionData
    ).then(() => {
      console.log('Welcome email sent to:', validatedData.email)
    }).catch((emailError) => {
      console.error('Failed to send welcome email:', emailError)
    })
    
    console.log('Returning registration response')
    return response
    
  } catch (error) {
    console.error('Registration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides.', details: error.errors },
        { status: 400 }
      )
    }
    
    // Handle MongoDB duplicate key error
    if ((error as any).code === 11000) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà.' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    )
  }
} 