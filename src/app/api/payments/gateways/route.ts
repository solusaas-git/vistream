import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongoose'
import PaymentGateway from '@/models/PaymentGateway'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    // Get active payment gateways sorted by priority
    const gateways = await PaymentGateway.find({
      isActive: true,
      status: 'active'
    })
    .select('+configuration') // Include configuration for payment processing
    .sort({ priority: -1, isRecommended: -1 }) // Higher priority and recommended first
    .lean()

    // Format gateways for frontend consumption
    const formattedGateways = gateways.map((gateway: any) => ({
      id: gateway._id.toString(),
      provider: gateway.provider,
      displayName: gateway.displayName,
      description: gateway.description,
      isRecommended: gateway.isRecommended,
      priority: gateway.priority,
      supportedCurrencies: gateway.supportedCurrencies,
      supportedPaymentMethods: gateway.supportedPaymentMethods,
      fees: gateway.fees,
      limits: gateway.limits,
      // Only include public configuration fields
      configuration: {
        stripePublishableKey: gateway.configuration?.stripePublishableKey,
        stripeTestMode: gateway.configuration?.stripeTestMode,
        mollieTestMode: gateway.configuration?.mollieTestMode,
        paypalSandbox: gateway.configuration?.paypalSandbox,
      }
    }))

    return NextResponse.json({
      success: true,
      gateways: formattedGateways
    })

  } catch (error) {
    console.error('Error fetching payment gateways:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

 