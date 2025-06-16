import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/rbac'
import connectToDatabase from '@/lib/mongoose'
import Payment from '@/models/Payment'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50) // Max 50 per page
    const status = searchParams.get('status')
    const provider = searchParams.get('provider')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build query
    const query: any = { userId: user.userId }
    
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

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get payments with pagination
    const [payments, totalCount] = await Promise.all([
      Payment.find(query)
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
      isProcessed: payment.isProcessed,
      metadata: payment.metadata,
      // Include provider-specific data
      ...(payment.mollieData && { mollieData: payment.mollieData }),
      ...(payment.stripeData && { stripeData: payment.stripeData })
    }))

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
          startDate,
          endDate
        }
      }
    })

  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des paiements' 
      },
      { status: 500 }
    )
  }
} 