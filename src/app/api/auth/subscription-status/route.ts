import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import connectToDatabase from '@/lib/mongoose'
import Subscription from '@/models/Subscription'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // Verify JWT token
    let userId
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
      const { payload } = await jwtVerify(token, secret)
      userId = payload.userId
    } catch (error) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    await connectToDatabase()

    // Get user information including role
    const user = await User.findById(userId).select('role email firstName lastName')
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // Find the latest subscription for this user
    // Use lean() for better performance and to avoid caching issues
    const subscription = await Subscription.findOne({ 
      userId: userId 
    }).sort({ createdAt: -1 }).lean()

    return NextResponse.json({
      authenticated: true,
      userId,
      user: {
        role: user.role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      },
      subscription: subscription ? {
        status: subscription.status,
        planId: subscription.planId,
        createdAt: subscription.createdAt,
        endDate: subscription.endDate
      } : null
    })

  } catch (error) {
    console.error('Error checking subscription status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 