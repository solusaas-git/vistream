import { NextRequest, NextResponse } from 'next/server'
import PaymentGateway from '@/models/PaymentGateway'
import connectToDatabase from '@/lib/mongoose'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    // Get all active payment gateways ordered by priority (highest first)
    const activeGateways = await PaymentGateway.find({ 
      isActive: true 
    }).select('provider displayName description supportedCurrencies supportedPaymentMethods fees limits priority isRecommended')
      .sort({ priority: -1, createdAt: 1 }) // Sort by priority desc, then by creation date asc

    // Format the response for frontend consumption
    const gateways = activeGateways.map(gateway => ({
      id: gateway._id,
      provider: gateway.provider,
      displayName: gateway.displayName,
      description: gateway.description,
      supportedCurrencies: gateway.supportedCurrencies || ['EUR', 'USD'],
      supportedPaymentMethods: gateway.supportedPaymentMethods || [],
      fees: gateway.fees || { fixedFee: 0, percentageFee: 0, currency: 'EUR' },
      limits: gateway.limits || { minAmount: 0.01, maxAmount: 10000, currency: 'EUR' },
      priority: gateway.priority || 0,
      isRecommended: gateway.isRecommended || false
    }))

    return NextResponse.json({
      success: true,
      gateways: gateways,
      count: gateways.length
    })

  } catch (error) {
    console.error('Error fetching active payment gateways:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des passerelles de paiement' 
      },
      { status: 500 }
    )
  }
} 