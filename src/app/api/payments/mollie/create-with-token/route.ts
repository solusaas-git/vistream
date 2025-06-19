import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/rbac'
import { MollieService } from '@/lib/mollie'
import connectToDatabase from '@/lib/mongoose'
import Payment from '@/models/Payment'
import { z } from 'zod'

const createWithTokenSchema = z.object({
  cardToken: z.string(),
  amount: z.number().positive(),
  currency: z.string().default('EUR'),
  description: z.string(),
  customerEmail: z.string().email().optional(),
  customerName: z.string().optional(),
  metadata: z.record(z.any()).optional()
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createWithTokenSchema.parse(body)

    await connectToDatabase()

    // Get Mollie service from active gateway
    const mollieService = await MollieService.fromActiveGateway()
    const gateway = await MollieService.getActiveGateway()
    
    // Create payment with card token - use direct API call for card token payments
    const paymentData = {
      method: 'creditcard',
      amount: {
        currency: validatedData.currency.toUpperCase(),
        value: validatedData.amount.toFixed(2)
      },
      description: validatedData.description,
      cardToken: validatedData.cardToken,
      redirectUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/payment?success=true`,
      webhookUrl: `https://ecda-196-119-62-0.ngrok-free.app/api/webhooks/mollie`,
      metadata: {
        ...validatedData.metadata,
        userId: user.userId,
        customerEmail: validatedData.customerEmail || '',
        customerName: validatedData.customerName || '',
        createdAt: new Date().toISOString(),
        paymentMethod: 'mollie_components'
      }
    }

    // Create payment directly with Mollie API for card token payments
    const response = await fetch('https://api.mollie.com/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${gateway.configuration.mollieApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Mollie API error: ${errorData.detail || response.statusText}`)
    }

    const molliePayment = await response.json()

    // Save payment to database
    const payment = new Payment({
      provider: 'mollie',
      externalPaymentId: molliePayment.id,
      userId: user.userId,
      gatewayId: gateway._id,
      amount: {
        value: validatedData.amount,
        currency: validatedData.currency
      },
      description: validatedData.description,
      status: molliePayment.status === 'open' ? 'pending' : 
              molliePayment.status === 'paid' ? 'completed' : 
              molliePayment.status === 'canceled' ? 'cancelled' : molliePayment.status,
      redirectUrl: paymentData.redirectUrl,
      webhookUrl: paymentData.webhookUrl,
      checkoutUrl: molliePayment._links?.checkout?.href,
      metadata: paymentData.metadata,
      expiresAt: molliePayment.expiresAt ? new Date(molliePayment.expiresAt) : undefined,
      mollieData: {
        paymentId: molliePayment.id,
        checkoutUrl: molliePayment._links?.checkout?.href,
        cardToken: validatedData.cardToken
      }
    })

    await payment.save()

    // Log payment creation
    console.log('Mollie Components payment created:', {
      paymentId: molliePayment.id,
      amount: validatedData.amount,
      currency: validatedData.currency,
      userId: user.userId,
      description: validatedData.description,
      cardToken: validatedData.cardToken.substring(0, 10) + '...'
    })

    // Return payment details
    return NextResponse.json({
      success: true,
      payment: {
        id: molliePayment.id,
        amount: {
          value: validatedData.amount,
          currency: validatedData.currency
        },
        description: validatedData.description,
        status: molliePayment.status === 'open' ? 'pending' : 
                molliePayment.status === 'paid' ? 'completed' : 
                molliePayment.status === 'canceled' ? 'cancelled' : molliePayment.status,
        checkoutUrl: molliePayment._links?.checkout?.href, // For 3D Secure if needed
        metadata: paymentData.metadata
      }
    })

  } catch (error) {
    console.error('Error creating Mollie Components payment:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création du paiement Mollie' },
      { status: 500 }
    )
  }
} 