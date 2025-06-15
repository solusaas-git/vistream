import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/rbac'
import { MollieService } from '@/lib/mollie'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const paymentId = params.id

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'ID de paiement requis' },
        { status: 400 }
      )
    }

    // Get Mollie service instance
    const mollieService = await MollieService.fromActiveGateway()

    // Fetch payment details from Mollie
    const payment = await mollieService.getPayment(paymentId)

    // Return payment details
    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        description: payment.description,
        metadata: payment.metadata,
        createdAt: payment.createdAt,
        expiresAt: payment.expiresAt,
        profileId: payment.profileId,
        sequenceType: payment.sequenceType,
        redirectUrl: payment.redirectUrl,
        webhookUrl: payment.webhookUrl,
        _links: payment._links,
      }
    })

  } catch (error) {
    console.error('Error fetching payment:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { 
          success: false, 
          error: error.message 
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération du paiement' 
      },
      { status: 500 }
    )
  }
} 