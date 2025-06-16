import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/rbac'
import connectToDatabase from '@/lib/mongoose'
import Payment from '@/models/Payment'
import User from '@/models/User'
import Subscription from '@/models/Subscription'

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    await connectToDatabase()

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100) // Max 100 per page
    const status = searchParams.get('status')
    const provider = searchParams.get('provider')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search') // Search by email, name, or payment ID
    const includeAnalytics = searchParams.get('analytics') === 'true'

    // Build query based on user role
    const query: any = {}
    
    // Role-based filtering
    if (user.role === 'user') {
      // Users can only see payments for customers they are affiliated with
      if (userId) {
        // Check if the requested userId is one of their affiliated customers
        const affiliatedSubscriptions = await Subscription.find({ 
          affiliatedUserId: user.userId 
        }).select('userId').lean()
        
        const affiliatedUserIds = affiliatedSubscriptions.map(sub => sub.userId.toString())
        
        if (!affiliatedUserIds.includes(userId)) {
          return NextResponse.json({
            success: true,
            data: {
              payments: [],
              pagination: {
                currentPage: page,
                totalPages: 0,
                totalCount: 0,
                limit,
                hasNextPage: false,
                hasPrevPage: false
              }
            }
          })
        }
        
        query.userId = userId
      } else {
        // If no specific userId requested, show payments for all their affiliated customers
        const affiliatedSubscriptions = await Subscription.find({ 
          affiliatedUserId: user.userId 
        }).select('userId').lean()
        
        const affiliatedUserIds = affiliatedSubscriptions.map(sub => sub.userId)
        
        if (affiliatedUserIds.length === 0) {
          return NextResponse.json({
            success: true,
            data: {
              payments: [],
              pagination: {
                currentPage: page,
                totalPages: 0,
                totalCount: 0,
                limit,
                hasNextPage: false,
                hasPrevPage: false
              }
            }
          })
        }
        
        query.userId = { $in: affiliatedUserIds }
      }
    } else if (user.role === 'admin') {
      // Admins can see all payments, apply userId filter if specified
      if (userId) {
        query.userId = userId
      }
    } else {
      // Customers shouldn't access this endpoint
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 403 }
      )
    }
    
    if (status) {
      query.status = status
    }
    
    if (provider) {
      query.provider = provider
    }
    
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) {
        query.createdAt.$gte = new Date(startDate)
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate)
      }
    }

    // Handle search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i')
      
      // First, find users matching the search term
      let userSearchQuery: any = {
        $or: [
          { email: searchRegex },
          { firstName: searchRegex },
          { lastName: searchRegex }
        ]
      }
      
      // For users with 'user' role, limit search to their affiliated customers
      if (user.role === 'user') {
        const affiliatedSubscriptions = await Subscription.find({ 
          affiliatedUserId: user.userId 
        }).select('userId').lean()
        
        const affiliatedUserIds = affiliatedSubscriptions.map(sub => sub.userId)
        userSearchQuery._id = { $in: affiliatedUserIds }
      }
      
      const matchingUsers = await User.find(userSearchQuery).select('_id').lean()
      const userIds = matchingUsers.map(u => u._id)
      
      // Then search in payments
      const searchOr: any[] = [
        { externalPaymentId: searchRegex },
        { description: searchRegex }
      ]
      
      if (userIds.length > 0) {
        searchOr.push({ userId: { $in: userIds } })
      }
      
      query.$or = searchOr
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get payments with user information
    const [payments, totalCount] = await Promise.all([
      Payment.find(query)
        .populate('userId', 'email firstName lastName role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(query)
    ])

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit)
    const hasNextPage = page < totalPages
    const hasPrevPage = page > 1

    // Format payments for response
    const formattedPayments = payments.map(payment => ({
      id: payment._id,
      externalId: payment.externalPaymentId,
      provider: payment.provider,
      status: payment.status,
      amount: payment.amount,
      description: payment.description,
      method: payment.method,
      createdAt: payment.createdAt,
      paidAt: payment.paidAt,
      expiresAt: payment.expiresAt,
      webhookProcessedAt: payment.webhookProcessedAt,
      webhookAttempts: payment.webhookAttempts,
      isProcessed: payment.isProcessed,
      lastSyncAt: (payment as any).lastSyncAt,
      metadata: payment.metadata,
      statusHistory: (payment as any).statusHistory,
      // User information
      user: payment.userId && typeof payment.userId === 'object' ? {
        id: (payment.userId as any)._id,
        email: (payment.userId as any).email,
        name: `${(payment.userId as any).firstName} ${(payment.userId as any).lastName}`,
        role: (payment.userId as any).role
      } : null,
      // Include provider-specific data
      ...(payment.mollieData && { mollieData: payment.mollieData }),
      ...(payment.stripeData && { stripeData: payment.stripeData })
    }))

    // Calculate analytics if requested
    let analytics = null
    if (includeAnalytics) {
      const analyticsQuery = { ...query }
      delete analyticsQuery.$or // Remove search for analytics

      const [
        totalRevenue,
        statusCounts,
        providerCounts,
        recentPayments
      ] = await Promise.all([
        // Total revenue from completed payments
        Payment.aggregate([
          { $match: { ...analyticsQuery, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount.value' } } }
        ]),
        // Payment status distribution
        Payment.aggregate([
          { $match: analyticsQuery },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        // Provider distribution
        Payment.aggregate([
          { $match: analyticsQuery },
          { $group: { _id: '$provider', count: { $sum: 1 } } }
        ]),
        // Recent payments (last 24 hours)
        Payment.countDocuments({
          ...analyticsQuery,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        })
      ])

      analytics = {
        totalRevenue: totalRevenue[0]?.total || 0,
        totalPayments: totalCount,
        recentPayments,
        statusDistribution: statusCounts.reduce((acc, item) => {
          acc[item._id] = item.count
          return acc
        }, {}),
        providerDistribution: providerCounts.reduce((acc, item) => {
          acc[item._id] = item.count
          return acc
        }, {})
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        payments: formattedPayments,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNextPage,
          hasPrevPage
        },
        filters: {
          status,
          provider,
          userId,
          startDate,
          endDate,
          search
        },
        ...(analytics && { analytics })
      }
    })

  } catch (error) {
    console.error('Error fetching admin payments:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des paiements' 
      },
      { status: 500 }
    )
  }
}) 