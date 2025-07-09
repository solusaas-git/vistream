import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import connectToDatabase from '@/lib/mongoose'
import User from '@/models/User'
import Plan from '@/models/Plan'
import Subscription from '@/models/Subscription'

// JWT verification for session management (same as subscription-status API)
async function getUserFromToken(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value

    if (!token) {
      console.log('No auth token found')
      return null
    }

    // Verify JWT token
    let userId
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
      const { payload } = await jwtVerify(token, secret)
      userId = payload.userId
    } catch (error) {
      console.log('JWT verification failed:', error)
      return null
    }

    await connectToDatabase()

    // Get user information
    const user = await User.findById(userId).select('role email firstName lastName')
    console.log('Found user:', user ? { id: user._id, email: user.email } : null)
    
    return user
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

interface PaymentSession {
  type: 'subscription' | 'renewal' | 'upgrade'
  planId: string
  planName: string
  amount: number
  currency: string
  description: string
  userId: string
  userEmail: string
  userName: string
  metadata?: Record<string, any>
  expiresAt: Date
}

// In-memory session storage (in production, use Redis or database)
// Use globalThis to persist across hot reloads in development
const globalForSessions = globalThis as unknown as {
  paymentSessions: Map<string, PaymentSession> | undefined
}

const paymentSessions = globalForSessions.paymentSessions ?? new Map<string, PaymentSession>()

if (process.env.NODE_ENV !== 'production') {
  globalForSessions.paymentSessions = paymentSessions
}

// Cleanup expired sessions every 30 minutes
setInterval(() => {
  const now = new Date()
  for (const [sessionId, session] of paymentSessions.entries()) {
    if (session.expiresAt < now) {
      paymentSessions.delete(sessionId)
    }
  }
}, 30 * 60 * 1000)

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Get payment session for this user
    const sessionId = `payment_${user._id}`
    console.log(`🔍 Looking for session: ${sessionId}`)
    console.log(`📦 Available sessions: ${Array.from(paymentSessions.keys()).join(', ')}`)
    
    const paymentSession = paymentSessions.get(sessionId)

    if (!paymentSession || paymentSession.expiresAt < new Date()) {
      // No valid session
      console.log(`❌ No valid session found for ${sessionId}`)
      paymentSessions.delete(sessionId)
      return NextResponse.json({ 
        success: false, 
        error: 'Aucune session de paiement valide' 
      })
    }

    console.log(`✅ Session found for ${sessionId}:`, paymentSession.type)
    return NextResponse.json({
      success: true,
      session: paymentSession
    })

  } catch (error) {
    console.error('Error fetching payment session:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { type, planId, subscriptionId } = body

    if (!type || !planId) {
      return NextResponse.json(
        { error: 'Type et planId requis' },
        { status: 400 }
      )
    }

    const plan = await Plan.findById(planId)
    if (!plan) {
      return NextResponse.json({ error: 'Plan non trouvé' }, { status: 404 })
    }

    // Create payment session
    const sessionId = `payment_${user._id}`
    // Handle French decimal format (120,99€ -> 120.99)
    let amount = parseFloat(plan.price.replace(/[€$]/g, '').replace(',', '.'))
    let description = `${plan.name}`
    
    console.log(`💰 Plan price: "${plan.price}" -> parsed amount: ${amount}`)
    let metadata: Record<string, any> = {
      type,
      planId: plan._id.toString(),
      planName: plan.name,
      userId: user._id.toString()
    }

    // Check for existing subscription to get affiliation data
    const existingSubscription = await Subscription.findOne({ userId: user._id }).sort({ createdAt: -1 })
    if (existingSubscription && existingSubscription.affiliationCode) {
      metadata.affiliationCode = existingSubscription.affiliationCode
      if (existingSubscription.affiliatedUserId) {
        metadata.affiliatedUserId = existingSubscription.affiliatedUserId.toString()
      }
    }

    // Handle different payment types
    if (type === 'upgrade' || type === 'renewal') {
      if (!subscriptionId) {
        return NextResponse.json(
          { error: 'subscriptionId requis pour upgrade/renewal' },
          { status: 400 }
        )
      }

      const currentSubscription = await Subscription.findById(subscriptionId)
      if (!currentSubscription || currentSubscription.userId.toString() !== user._id.toString()) {
        return NextResponse.json(
          { error: 'Abonnement non trouvé' },
          { status: 404 }
        )
      }

      // For upgrades, charge full amount of new plan
      if (type === 'upgrade') {
        const currentPlan = await Plan.findById(currentSubscription.planId)
        if (currentPlan) {
          console.log(`💰 Current plan: "${currentPlan.name}" (${currentPlan.price})`)
          console.log(`💰 New plan: "${plan.name}" (${plan.price})`)
          console.log(`💰 Upgrade cost: ${amount} (full price of new plan)`)
          description = `Mise à niveau vers ${plan.name}`
        }
      } else {
        description = `Renouvellement ${plan.name}`
      }

      metadata = {
        ...metadata,
        currentSubscriptionId: (currentSubscription._id as any).toString(),
        currentPlanId: currentSubscription.planId,
        isRenewal: type === 'renewal'
      }
    } else {
      description = `Abonnement ${plan.name}`
    }

    const paymentSession: PaymentSession = {
      type: type as 'subscription' | 'renewal' | 'upgrade',
      planId: plan._id.toString(),
      planName: plan.name,
      amount,
      currency: 'EUR',
      description,
      userId: user._id.toString(),
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`,
      metadata,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    }

    paymentSessions.set(sessionId, paymentSession)
    console.log(`💾 Session created for ${sessionId}:`, paymentSession.type)

    return NextResponse.json({
      success: true,
      sessionCreated: true,
      session: paymentSession
    })

  } catch (error) {
    console.error('Error creating payment session:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Clear payment session
    const sessionId = `payment_${user._id}`
    paymentSessions.delete(sessionId)

    return NextResponse.json({
      success: true,
      sessionCleared: true
    })

  } catch (error) {
    console.error('Error clearing payment session:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 