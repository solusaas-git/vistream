import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/rbac'
import connectToDatabase from '@/lib/mongoose'
import Payment from '@/models/Payment'
import { MollieService } from '@/lib/mollie'

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

    // Find the latest payment for this user
    const latestPayment = await Payment.findOne({ 
      userId: user.userId 
    }).sort({ createdAt: -1 })

    if (!latestPayment) {
      return NextResponse.json(
        { success: false, error: 'Aucun paiement trouvé' },
        { status: 404 }
      )
    }

    // Get fresh payment status from Mollie
    try {
      const mollieService = await MollieService.fromActiveGateway()
      const molliePayment = await mollieService.getPayment(latestPayment.molliePaymentId)

      // Update local payment status if different
      if (molliePayment.status !== latestPayment.status) {
        latestPayment.status = molliePayment.status
        await latestPayment.save()
      }

      // Return payment details
      return NextResponse.json({
        success: true,
        payment: {
          id: molliePayment.id,
          status: molliePayment.status,
          amount: molliePayment.amount,
          description: molliePayment.description,
          metadata: molliePayment.metadata,
          createdAt: molliePayment.createdAt,
          expiresAt: molliePayment.expiresAt,
          profileId: molliePayment.profileId,
          sequenceType: molliePayment.sequenceType,
          redirectUrl: molliePayment.redirectUrl,
          webhookUrl: molliePayment.webhookUrl,
          _links: molliePayment._links,
        }
      })

    } catch (mollieError) {
      console.error('Error fetching from Mollie:', mollieError)
      
      // Return local payment data if Mollie fails
      return NextResponse.json({
        success: true,
        payment: {
          id: latestPayment.molliePaymentId,
          status: latestPayment.status,
          amount: latestPayment.amount,
          description: latestPayment.description,
          metadata: latestPayment.metadata,
          createdAt: latestPayment.mollieCreatedAt || latestPayment.createdAt,
          expiresAt: latestPayment.mollieExpiresAt,
        }
      })
    }

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