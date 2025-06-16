import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/rbac'
import connectToDatabase from '@/lib/mongoose'
import Subscription from '@/models/Subscription'
import User from '@/models/User'
import Payment from '@/models/Payment'

// GET /api/admin/subscriptions - Fetch subscriptions with filtering and pagination
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    // Connect to database
    await connectToDatabase()

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const planFilter = searchParams.get('plan') || ''
    const statusFilter = searchParams.get('status') || ''

    // Build query based on user role
    const query: any = {}
    
    // Role-based filtering
    if (user.role === 'user') {
      // Users can only see subscriptions they are affiliated with
      query.affiliatedUserId = user.userId
    } else if (user.role === 'admin') {
      // Admins can see all subscriptions
    } else {
      // Customers shouldn't access this endpoint
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      )
    }
    
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

    // Calculate stats based on user role
    let allSubscriptions
    if (user.role === 'user') {
      // Users only see stats for their affiliated subscriptions
      allSubscriptions = await Subscription.find({ affiliatedUserId: user.userId })
    } else {
      // Admins see all subscription stats
      allSubscriptions = await Subscription.find({})
    }
    
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

    // Get payment counts for all users
    const userIds = filteredSubscriptions.map(sub => sub.userId)
    const paymentCounts = await Payment.aggregate([
      { $match: { userId: { $in: userIds } } },
      { 
        $group: { 
          _id: '$userId', 
          totalPayments: { $sum: 1 },
          completedPayments: { 
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } 
          },
          totalAmount: { 
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount.value', 0] } 
          }
        } 
      }
    ])

    // Create a map for quick lookup
    const paymentCountMap = paymentCounts.reduce((acc, item) => {
      acc[item._id.toString()] = {
        total: item.totalPayments,
        completed: item.completedPayments,
        totalAmount: item.totalAmount
      }
      return acc
    }, {} as Record<string, { total: number; completed: number; totalAmount: number }>)

    // Format subscriptions for response
    const formattedSubscriptions = filteredSubscriptions.map(sub => {
      const user = sub.userId as any
      const affiliatedUser = sub.affiliatedUserId as any
      // Get the actual user ID string (handle both ObjectId and populated user object)
      const actualUserId = user && user._id ? user._id.toString() : sub.userId.toString()
      const paymentInfo = paymentCountMap[actualUserId] || { total: 0, completed: 0, totalAmount: 0 }
      
      return {
        _id: sub._id,
        userId: actualUserId,
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
        // Payment data
        paymentStats: {
          totalPayments: paymentInfo.total,
          completedPayments: paymentInfo.completed,
          totalAmount: paymentInfo.totalAmount
        },
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
      { success: false, error: 'Erreur lors de la récupération des abonnements' },
      { status: 500 }
    )
  }
}, 'user') // Allow both user and admin roles

// POST /api/admin/subscriptions - Create new subscription
export const POST = withAuth(async (request: NextRequest, user) => {
  try {
    // Only admins can create subscriptions
    if (user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Seuls les administrateurs peuvent créer des abonnements' },
        { status: 403 }
      )
    }

    // Connect to database
    await connectToDatabase()

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
      { success: false, error: 'Erreur lors de la création de l\'abonnement' },
      { status: 500 }
    )
  }
}, 'admin') // Only admins can create subscriptions 