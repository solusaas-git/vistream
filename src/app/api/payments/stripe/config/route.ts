import { NextRequest, NextResponse } from 'next/server'
import { StripeService } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  try {
    // Get active Stripe gateway configuration
    const gateway = await StripeService.getActiveGateway()
    
    if (!gateway.configuration?.stripePublishableKey) {
      return NextResponse.json(
        { success: false, error: 'Clé publique Stripe non configurée' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      publishableKey: gateway.configuration.stripePublishableKey,
      testMode: gateway.configuration.stripeTestMode ?? true
    })

  } catch (error) {
    console.error('Error fetching Stripe config:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération de la configuration Stripe' },
      { status: 500 }
    )
  }
} 