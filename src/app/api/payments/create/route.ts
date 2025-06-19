import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/rbac'
import { MollieService, MolliePaymentData } from '@/lib/mollie'
import { StripeService, StripePaymentData } from '@/lib/stripe'
import Payment from '@/models/Payment'
import PaymentGateway from '@/models/PaymentGateway'
import connectToDatabase from '@/lib/mongoose'
import { z } from 'zod'

// Validation schema for payment creation
const createPaymentSchema = z.object({
  amount: z.number().positive('Le montant doit être positif'),
  currency: z.string().length(3, 'La devise doit faire 3 caractères').default('EUR'),
  description: z.string().min(1, 'La description est requise').max(255, 'Description trop longue'),
  customerEmail: z.string().email('Email invalide'),
  customerName: z.string().min(1, 'Le nom du client est requis').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  provider: z.enum(['mollie', 'stripe', 'paypal']).optional(),
  redirectUrl: z.string().url('URL de redirection invalide').optional(),
  webhookUrl: z.string().url('URL de webhook invalide').optional(),
  gatewayId: z.string().optional(),
  isTest: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
  method: z.array(z.string()).optional(),
  locale: z.string().optional(),
})

type CreatePaymentRequest = z.infer<typeof createPaymentSchema>

// Helper function to create Mollie payment
async function createMolliePayment(validatedData: CreatePaymentRequest, user: any, redirectUrl: string) {
  const mollieService = await MollieService.fromActiveGateway()
  
  // Get the gateway configuration to extract webhook URL
  const gateway = await MollieService.getActiveGateway()
  const configuredWebhookUrl = gateway?.configuration?.webhookUrl
  
  const paymentData: MolliePaymentData = {
    amount: MollieService.formatAmount(validatedData.amount, validatedData.currency),
    description: validatedData.description,
    redirectUrl: redirectUrl,
    metadata: {
      ...validatedData.metadata,
      userId: user.userId,
      customerEmail: validatedData.customerEmail,
      customerName: validatedData.customerName,
      createdAt: new Date().toISOString(),
    },
  }

  // Add webhook URL - prioritize configured webhook URL from database
  if (configuredWebhookUrl && 
      !configuredWebhookUrl.includes('localhost') && 
      !configuredWebhookUrl.includes('127.0.0.1')) {
    paymentData.webhookUrl = configuredWebhookUrl
    console.log('🔗 Using configured webhook URL for Mollie:', configuredWebhookUrl)
  } else if (validatedData.webhookUrl && 
      !validatedData.webhookUrl.includes('localhost') && 
      !validatedData.webhookUrl.includes('127.0.0.1')) {
    paymentData.webhookUrl = validatedData.webhookUrl
    console.log('🔗 Using provided webhook URL for Mollie:', validatedData.webhookUrl)
  } else {
    console.log('⚠️ No valid webhook URL configured for Mollie payment')
  }
  
  if (validatedData.method) {
    paymentData.method = validatedData.method
  }
  if (validatedData.locale) {
    paymentData.locale = validatedData.locale
  }

  const molliePayment = await mollieService.createPayment(paymentData)
  
  return {
    id: molliePayment.id,
    amount: {
      value: parseFloat(molliePayment.amount.value),
      currency: molliePayment.amount.currency
    },
    description: molliePayment.description,
    status: molliePayment.status === 'open' ? 'pending' : 
            molliePayment.status === 'paid' ? 'completed' : 
            molliePayment.status === 'canceled' ? 'cancelled' : molliePayment.status,
    checkoutUrl: molliePayment._links.checkout.href,
    webhookUrl: molliePayment.webhookUrl,
    metadata: molliePayment.metadata,
    expiresAt: molliePayment.expiresAt ? new Date(molliePayment.expiresAt) : undefined
  }
}

// Helper function to create Stripe payment
async function createStripePayment(validatedData: CreatePaymentRequest, user: any, redirectUrl: string, cancelUrl: string) {
  const stripeService = await StripeService.fromActiveGateway()
  
  const paymentData: StripePaymentData = {
    amount: StripeService.formatAmount(validatedData.amount, validatedData.currency),
    currency: validatedData.currency,
    description: validatedData.description,
    customer_email: validatedData.customerEmail,
    success_url: redirectUrl,
    cancel_url: cancelUrl,
    metadata: {
      ...validatedData.metadata,
      userId: user.userId,
      customerEmail: validatedData.customerEmail,
      customerName: validatedData.customerName,
      createdAt: new Date().toISOString(),
    },
  }

  const stripeSession = await stripeService.createCheckoutSession(paymentData)
  
  return {
    id: stripeSession.id,
    sessionId: stripeSession.id,
    paymentIntentId: stripeSession.payment_intent as string,
    amount: {
      value: StripeService.formatAmountFromStripe(stripeSession.amount_total || 0, validatedData.currency),
      currency: validatedData.currency
    },
    description: validatedData.description,
    status: 'pending', // Stripe sessions start as pending
    paymentStatus: stripeSession.payment_status,
    checkoutUrl: stripeSession.url || '',
    webhookUrl: null,
    metadata: stripeSession.metadata,
    expiresAt: stripeSession.expires_at ? new Date(stripeSession.expires_at * 1000) : undefined
  }
}

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
    const validatedData = createPaymentSchema.parse(body)

    await connectToDatabase()

    // Check for existing pending payment with same metadata to prevent duplicates
    const existingPayment = await Payment.findOne({
      userId: user.userId,
      provider: validatedData.provider || 'mollie',
      status: 'pending',
      'amount.value': validatedData.amount,
      'amount.currency': validatedData.currency,
      description: validatedData.description,
      // Check if created within last 5 minutes to prevent duplicates
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
    }).sort({ createdAt: -1 })

    // If we have a recent pending payment with same details, return it instead of creating new one
    if (existingPayment && existingPayment.checkoutUrl) {
      console.log('Returning existing payment:', {
        paymentId: existingPayment.externalPaymentId,
        amount: validatedData.amount,
        currency: validatedData.currency,
        userId: user.userId,
        description: validatedData.description,
        provider: existingPayment.provider
      })

      return NextResponse.json({
        success: true,
        payment: {
          id: existingPayment.externalPaymentId,
          provider: existingPayment.provider,
          status: existingPayment.status,
          amount: existingPayment.amount,
          description: existingPayment.description,
          checkoutUrl: existingPayment.checkoutUrl,
          expiresAt: existingPayment.expiresAt,
          metadata: existingPayment.metadata,
          databaseId: existingPayment._id
        }
      })
    }

    // Determine which payment provider to use
    let provider = validatedData.provider
    if (!provider) {
      // Find active gateways if no provider specified
      const activeGateways = await PaymentGateway.find({ isActive: true })
      if (activeGateways.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Aucune passerelle de paiement active trouvée' },
          { status: 400 }
        )
      }
      
      // If multiple gateways are active, require provider selection
      if (activeGateways.length > 1) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Plusieurs passerelles sont actives. Veuillez spécifier le provider.',
            availableProviders: activeGateways.map(g => ({
              provider: g.provider,
              displayName: g.displayName,
              id: g._id
            }))
          },
          { status: 400 }
        )
      }
      
      // Use the single active gateway
      provider = activeGateways[0].provider
    }

    // Generate redirect URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const redirectUrl = validatedData.redirectUrl || `${baseUrl}/auth/payment?success=true`
    const cancelUrl = `${baseUrl}/auth/payment?cancelled=true`

    let paymentResult
    let gateway

    switch (provider) {
      case 'mollie':
        paymentResult = await createMolliePayment(validatedData, user, redirectUrl)
        gateway = await MollieService.getActiveGateway()
        break
      
      case 'stripe':
        paymentResult = await createStripePayment(validatedData, user, redirectUrl, cancelUrl)
        gateway = await StripeService.getActiveGateway()
        break
      
      default:
        return NextResponse.json(
          { success: false, error: `Passerelle de paiement non supportée: ${provider}` },
          { status: 400 }
        )
    }

    // Save payment to database
    const payment = new Payment({
      provider: provider,
      externalPaymentId: paymentResult.id,
      userId: user.userId,
      gatewayId: gateway._id,
      amount: {
        value: paymentResult.amount.value,
        currency: paymentResult.amount.currency
      },
      description: paymentResult.description,
      status: paymentResult.status,
      redirectUrl: redirectUrl,
      webhookUrl: paymentResult.webhookUrl,
      checkoutUrl: paymentResult.checkoutUrl,
      metadata: paymentResult.metadata || {},
      expiresAt: paymentResult.expiresAt,
      relatedType: validatedData.metadata?.relatedType,
      relatedId: validatedData.metadata?.relatedId,
      // Provider-specific data
      ...(provider === 'mollie' && {
        mollieData: {
          paymentId: paymentResult.id,
          checkoutUrl: paymentResult.checkoutUrl
        }
      }),
      ...(provider === 'stripe' && {
        stripeData: {
          sessionId: (paymentResult as any).sessionId,
          paymentIntentId: (paymentResult as any).paymentIntentId,
          paymentStatus: (paymentResult as any).paymentStatus
        }
      })
    })

    await payment.save()

    // Clean up old pending payments (older than 1 hour) to prevent database bloat
    try {
      await Payment.deleteMany({
        userId: user.userId,
        provider: provider,
        status: 'pending',
        createdAt: { $lt: new Date(Date.now() - 60 * 60 * 1000) }
      })
    } catch (cleanupError) {
      console.warn('Failed to cleanup old pending payments:', cleanupError)
    }

    // Log payment creation
    console.log('Payment created:', {
      provider: provider,
      paymentId: paymentResult.id,
      amount: paymentResult.amount,
      userId: user.userId,
      description: paymentResult.description
    })

    // Return payment details
    return NextResponse.json({
      success: true,
      payment: {
        id: paymentResult.id,
        provider: provider,
        status: paymentResult.status,
        amount: paymentResult.amount,
        description: paymentResult.description,
        checkoutUrl: paymentResult.checkoutUrl,
        expiresAt: paymentResult.expiresAt,
        metadata: paymentResult.metadata,
        databaseId: payment._id
      }
    })

  } catch (error) {
    console.error('Error creating payment:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Données invalides', 
          details: error.errors 
        },
        { status: 400 }
      )
    }

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
        error: 'Erreur lors de la création du paiement' 
      },
      { status: 500 }
    )
  }
} 