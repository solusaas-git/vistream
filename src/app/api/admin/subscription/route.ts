import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import connectToDatabase from '@/lib/mongoose'
import Subscription from '@/models/Subscription'

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token d\'authentification manquant' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Token invalide' },
        { status: 401 }
      )
    }

    // Connect to database
    await connectToDatabase()

    // Find user's active subscription
    const subscription = await Subscription.findOne({ 
      userId: decoded.userId,
      status: { $in: ['active', 'inactive', 'cancelled'] } // Exclude expired for now
    }).sort({ createdAt: -1 }) // Get most recent subscription

    return NextResponse.json({
      success: true,
      data: {
        subscription: subscription || null
      }
    })

  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 