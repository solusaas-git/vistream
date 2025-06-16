import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/rbac'
import connectToDatabase from '@/lib/mongoose'
import Subscription from '@/models/Subscription'
import User from '@/models/User'

// GET /api/auth/me - Get current user information
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Connect to database
    await connectToDatabase()
    
    // Verify that the user still exists in the database
    const dbUser = await User.findById(user.userId)
    if (!dbUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      )
    }
    
    // Get user's subscription
    const subscription = await Subscription.findOne({ 
      userId: user.userId 
    }).sort({ createdAt: -1 }) // Get the most recent subscription

    // Add subscription to user object (use fresh data from database)
    const userWithSubscription = {
      _id: dbUser._id,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      role: dbUser.role,
      isVerified: dbUser.isVerified,
      createdAt: dbUser.createdAt,
      subscription: subscription ? {
        _id: subscription._id,
        planId: subscription.planId,
        planName: subscription.planName,
        planPrice: subscription.planPrice,
        planPeriod: subscription.planPeriod,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        autoRenew: subscription.autoRenew
      } : null
    }

    return NextResponse.json({
      success: true,
      user: userWithSubscription
    })

  } catch (error) {
    console.error('Error getting user info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 