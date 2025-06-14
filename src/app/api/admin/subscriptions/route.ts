import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import connectToDatabase from '@/lib/mongoose'
import Subscription from '@/models/Subscription'
import User from '@/models/User'

// GET /api/admin/subscriptions - Fetch subscriptions with filtering and pagination
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

    // Verify token and check admin role
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Token invalide' },
        { status: 401 }
      )
    }

    // Connect to database
    await connectToDatabase()

    // Verify user is admin
    const user = await User.findById(decoded.userId)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const planFilter = searchParams.get('plan') || ''
    const statusFilter = searchParams.get('status') || ''

    // Build query
    const query: any = {}
    
    if (statusFilter && statusFilter !== 'all') {
      query.status = statusFilter
    }

    if (planFilter && planFilter !== 'all') {
      query.planName = new RegExp(planFilter, 'i')
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get subscriptions with user data
    const subscriptions = await Subscription.find(query)
      .populate('userId', 'firstName lastName email role')
      .populate('affiliatedUserId', 'firstName lastName email affiliationCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)

    // Filter by search term if provided (search in user data)
    let filteredSubscriptions = subscriptions
    if (search) {
      filteredSubscriptions = subscriptions.filter(sub => {
        const user = sub.userId as any
        if (!user) return false
        
        const searchLower = search.toLowerCase()
        return (
          user.firstName?.toLowerCase().includes(searchLower) ||
          user.lastName?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          sub.planName?.toLowerCase().includes(searchLower)
        )
      })
    }

    // Get total count for pagination
    const totalQuery = search ? {} : query // If searching, we need to count all and filter client-side
    const total = search ? filteredSubscriptions.length : await Subscription.countDocuments(query)
    const totalPages = Math.ceil(total / limit)

    // Calculate stats
    const allSubscriptions = await Subscription.find({})
    const stats = {
      total: allSubscriptions.length,
      active: allSubscriptions.filter(sub => sub.status === 'active').length,
      revenue: allSubscriptions.reduce((sum, sub) => {
        const price = parseFloat(sub.planPrice.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
        return sum + (sub.status === 'active' ? price : 0)
      }, 0),
      avgPrice: allSubscriptions.length > 0 ? 
        allSubscriptions.reduce((sum, sub) => {
          const price = parseFloat(sub.planPrice.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
          return sum + price
        }, 0) / allSubscriptions.length : 0
    }

    // Format subscriptions for response
    const formattedSubscriptions = filteredSubscriptions.map(sub => {
      const user = sub.userId as any
      const affiliatedUser = sub.affiliatedUserId as any
      return {
        _id: sub._id,
        userId: sub.userId,
        user: user ? {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role
        } : null,
        plan: sub.planName.toLowerCase(),
        planName: sub.planName,
        planPrice: sub.planPrice,
        planPeriod: sub.planPeriod,
        status: sub.status,
        startDate: sub.startDate,
        endDate: sub.endDate,
        price: parseFloat(sub.planPrice.replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
        currency: 'EUR',
        paymentMethod: 'stripe',
        autoRenew: sub.autoRenew,
        // Affiliation data
        affiliationCode: sub.affiliationCode,
        affiliatedUserId: sub.affiliatedUserId,
        affiliatedUser: affiliatedUser ? {
          firstName: affiliatedUser.firstName,
          lastName: affiliatedUser.lastName,
          email: affiliatedUser.email,
          affiliationCode: affiliatedUser.affiliationCode
        } : null,
        saleValue: sub.saleValue || 0,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        subscriptions: formattedSubscriptions,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        stats
      }
    })

  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST /api/admin/subscriptions - Create new subscription
export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token d\'authentification manquant' },
        { status: 401 }
      )
    }

    // Verify token and check admin role
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Token invalide' },
        { status: 401 }
      )
    }

    // Connect to database
    await connectToDatabase()

    // Verify user is admin
    const user = await User.findById(decoded.userId)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Create new subscription
    const subscription = new Subscription({
      userId: body.userId,
      planId: body.userId, // Using userId as planId for now
      planName: body.plan.charAt(0).toUpperCase() + body.plan.slice(1),
      planPrice: `${body.price}€`,
      planPeriod: 'mois',
      status: body.status,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      autoRenew: body.autoRenew
    })

    await subscription.save()

    // Populate user data for response
    await subscription.populate('userId', 'firstName lastName email role')

    const user_data = subscription.userId as any
    const formattedSubscription = {
      _id: subscription._id,
      userId: subscription.userId,
      user: user_data ? {
        firstName: user_data.firstName,
        lastName: user_data.lastName,
        email: user_data.email,
        role: user_data.role
      } : null,
      plan: subscription.planName.toLowerCase(),
      planName: subscription.planName,
      planPrice: subscription.planPrice,
      planPeriod: subscription.planPeriod,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      price: body.price,
      currency: body.currency,
      paymentMethod: body.paymentMethod,
      autoRenew: subscription.autoRenew,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt
    }

    return NextResponse.json({
      success: true,
      data: { subscription: formattedSubscription },
      message: 'Abonnement créé avec succès'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 