import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/rbac'
import connectToDatabase from '@/lib/mongoose'
import Payment from '@/models/Payment'
import { MollieService } from '@/lib/mollie'

// Function to normalize Mollie payment status to our payment schema
function normalizePaymentStatus(mollieStatus: string): 'pending' | 'completed' | 'failed' | 'cancelled' | 'expired' | 'refunded' {
  switch (mollieStatus) {
    case 'open':
    case 'pending':
      return 'pending'
    case 'paid':
      return 'completed'
    case 'failed':
      return 'failed'
    case 'canceled':
      return 'cancelled'
    case 'expired':
      return 'expired'
    case 'authorized':
      return 'pending'
    default:
      return 'pending'
  }
}

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

    // Find the latest payment for this user from database
    const latestPayment = await Payment.findOne({ 
      userId: user.userId 
    }).sort({ createdAt: -1 }).lean()

    if (!latestPayment) {
      return NextResponse.json(
        { success: false, error: 'Aucun paiement trouvé' },
        { status: 404 }
      )
    }

    // If payment is recent (less than 5 minutes old) and not completed, 
    // check with Mollie for real-time status
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const shouldCheckMollie = latestPayment.createdAt > fiveMinutesAgo && 
                             latestPayment.status !== 'completed' &&
                             latestPayment.provider === 'mollie'

    if (shouldCheckMollie) {
    try {
      const mollieService = await MollieService.fromActiveGateway()
      const molliePaymentId = latestPayment.mollieData?.paymentId || latestPayment.externalPaymentId
      const molliePayment = await mollieService.getPayment(molliePaymentId)

      // Update local payment status if different
        const normalizedStatus = normalizePaymentStatus(molliePayment.status)
        if (normalizedStatus !== latestPayment.status) {
          await Payment.findByIdAndUpdate(latestPayment._id, {
            status: normalizedStatus,
            lastSyncAt: new Date(),
            ...(molliePayment.status === 'paid' && !latestPayment.paidAt && { paidAt: new Date() })
          })
          
          console.log(`Payment ${molliePaymentId} status updated: ${latestPayment.status} → ${normalizedStatus}`)
      }

        // Return fresh Mollie data
      return NextResponse.json({
        success: true,
        payment: {
          id: molliePayment.id,
          status: molliePayment.status,
            normalizedStatus: normalizedStatus,
          amount: molliePayment.amount,
          description: molliePayment.description,
            method: latestPayment.method,
          metadata: molliePayment.metadata,
          createdAt: molliePayment.createdAt,
          expiresAt: molliePayment.expiresAt,
            paidAt: latestPayment.paidAt,
          profileId: molliePayment.profileId,
          sequenceType: molliePayment.sequenceType,
          redirectUrl: molliePayment.redirectUrl,
          webhookUrl: molliePayment.webhookUrl,
          _links: molliePayment._links,
            // Add database info
            dbId: latestPayment._id,
            webhookProcessedAt: latestPayment.webhookProcessedAt,
            isProcessed: latestPayment.isProcessed
        }
      })

    } catch (mollieError) {
      console.error('Error fetching from Mollie:', mollieError)
        // Fall through to return database data
      }
    }
      
    // Return database payment data (most common case)
      return NextResponse.json({
        success: true,
        payment: {
        id: latestPayment.externalPaymentId,
        dbId: latestPayment._id,
        status: latestPayment.status === 'completed' ? 'paid' : latestPayment.status,
        normalizedStatus: latestPayment.status,
        amount: latestPayment.amount ? {
          value: latestPayment.amount.value.toString(),
          currency: latestPayment.amount.currency
        } : { value: '0', currency: 'EUR' },
          description: latestPayment.description,
        method: latestPayment.method,
          metadata: latestPayment.metadata,
          createdAt: latestPayment.createdAt,
          expiresAt: latestPayment.expiresAt,
        paidAt: latestPayment.paidAt,
        webhookProcessedAt: latestPayment.webhookProcessedAt,
        isProcessed: latestPayment.isProcessed,
        provider: latestPayment.provider,
        // Mollie specific data if available
        ...(latestPayment.mollieData && {
          profileId: latestPayment.mollieData.profileId,
          checkoutUrl: latestPayment.mollieData.checkoutUrl
      })
    }
    })

  } catch (error) {
    console.error('Error fetching latest payment:', error)

    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération du paiement' 
      },
      { status: 500 }
    )
  }
} 