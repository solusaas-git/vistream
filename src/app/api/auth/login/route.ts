import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectToDatabase from '@/lib/mongoose'
import User from '@/models/User'
import { generateToken, generateRefreshToken, sanitizeUser } from '@/lib/auth'
import { rateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit'

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Veuillez entrer une adresse email valide."),
  password: z.string().min(1, "Le mot de passe est requis."),
  rememberMe: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, rateLimitConfigs.login)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitResponse(rateLimitResult.resetTime),
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          }
        }
      )
    }

    const body = await request.json()
    
    // Validate input
    const validatedData = loginSchema.parse(body)
    
    // Connect to database
    await connectToDatabase()
    
    // Find user by credentials (includes password verification and account locking)
    const user = await (User as any).findByCredentials(validatedData.email, validatedData.password)
    
    // Check if account is verified
    if (!user.isVerified) {
      return NextResponse.json(
        { error: 'Compte non vérifié. Vérifiez votre email.' },
        { status: 401 }
      )
    }
    
    // Generate tokens
    const tokenPayload = { userId: user._id.toString(), email: user.email }
    const accessToken = generateToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)
    
    console.log('User logged in successfully:', user.email)
    
    // Prepare response
    const response = NextResponse.json({
      message: 'Connexion réussie.',
      user: sanitizeUser(user),
      accessToken,
    }, { status: 200 })
    
    // Set HTTP-only cookies for tokens
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
    }
    
    response.cookies.set('auth-token', accessToken, {
      ...cookieOptions,
      maxAge: validatedData.rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60, // 7 days or 1 day
    })
    
    response.cookies.set('refresh-token', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })
    
    return response
    
  } catch (error) {
    console.error('Login error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides.', details: error.errors },
        { status: 400 }
      )
    }
    
    // Handle specific authentication errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid credentials')) {
        return NextResponse.json(
          { error: 'Email ou mot de passe incorrect.' },
          { status: 401 }
        )
      }
      
      if (error.message.includes('Account temporarily locked')) {
        return NextResponse.json(
          { error: 'Compte temporairement verrouillé en raison de trop nombreuses tentatives de connexion.' },
          { status: 423 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    )
  }
} 