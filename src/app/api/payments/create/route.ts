import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/rbac'
import { MollieService, MolliePaymentData } from '@/lib/mollie'
import Payment from '@/models/Payment'
import { z } from 'zod'

// Validation schema for payment creation
const createPaymentSchema = z.object({
  amount: z.number().positive('Le montant doit être positif'),
  currency: z.string().length(3, 'La devise doit faire 3 caractères').default('EUR'),
  description: z.string().min(1, 'La description est requise').max(255, 'Description trop longue'),
  redirectUrl: z.string().url('URL de redirection invalide'),
  webhookUrl: z.string().url('URL de webhook invalide').optional(),
  metadata: z.record(z.any()).optional(),
  method: z.array(z.string()).optional(),
  locale: z.string().optional(),
})

type CreatePaymentRequest = z.infer<typeof createPaymentSchema>

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

    // Get Mollie service instance
    const mollieService = await MollieService.fromActiveGateway()

    // Prepare payment data
    const paymentData: MolliePaymentData = {
      amount: MollieService.formatAmount(validatedData.amount, validatedData.currency),
      description: validatedData.description,
      redirectUrl: validatedData.redirectUrl,
      metadata: {
        ...validatedData.metadata,
        userId: user.userId,
        createdAt: new Date().toISOString(),
      },
    }

    // Add optional fields
    if (validatedData.webhookUrl) {
      paymentData.webhookUrl = validatedData.webhookUrl
    }
    if (validatedData.method) {
      paymentData.method = validatedData.method
    }
    if (validatedData.locale) {
      paymentData.locale = validatedData.locale
    }

    // Create payment with Mollie
    const molliePayment = await mollieService.createPayment(paymentData)

    // Get the active gateway for database record
    const gateway = await MollieService.getActiveGateway()

    // Save payment to database
    const payment = new Payment({
      molliePaymentId: molliePayment.id,
      userId: user.userId,
      gatewayId: gateway._id,
      amount: {
        value: parseFloat(molliePayment.amount.value),
        currency: molliePayment.amount.currency
      },
      description: molliePayment.description,
      status: molliePayment.status,
      redirectUrl: molliePayment.redirectUrl,
      webhookUrl: molliePayment.webhookUrl,
      checkoutUrl: molliePayment._links.checkout.href,
      metadata: molliePayment.metadata || {},
      mollieCreatedAt: new Date(molliePayment.createdAt),
      mollieExpiresAt: molliePayment.expiresAt ? new Date(molliePayment.expiresAt) : undefined,
      relatedType: validatedData.metadata?.relatedType,
      relatedId: validatedData.metadata?.relatedId
    })

    await payment.save()

    // Log payment creation
    console.log('Payment created:', {
      paymentId: molliePayment.id,
      amount: molliePayment.amount,
      userId: user.userId,
      description: molliePayment.description
    })

    // Return payment details
    return NextResponse.json({
      success: true,
      payment: {
        id: molliePayment.id,
        status: molliePayment.status,
        amount: molliePayment.amount,
        description: molliePayment.description,
        checkoutUrl: molliePayment._links.checkout.href,
        expiresAt: molliePayment.expiresAt,
        metadata: molliePayment.metadata,
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