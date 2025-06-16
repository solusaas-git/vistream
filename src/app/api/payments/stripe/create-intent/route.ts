import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/rbac'
import { StripeService } from '@/lib/stripe'
import connectToDatabase from '@/lib/mongoose'
import Payment from '@/models/Payment'
import { z } from 'zod'

const createIntentSchema = z.object({
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
    const validatedData = createIntentSchema.parse(body)

    await connectToDatabase()

    // Check for existing pending payment with same metadata to prevent duplicates
    const existingPayment = await Payment.findOne({
      userId: user.userId,
      provider: 'stripe',
      status: 'pending',
      'amount.value': validatedData.amount,
      'amount.currency': validatedData.currency,
      description: validatedData.description,
      // Check if created within last 30 seconds to catch rapid duplicates
      createdAt: { $gte: new Date(Date.now() - 30 * 1000) }
    }).sort({ createdAt: -1 })

    // If we have a recent pending payment with same details, return it instead of creating new one
    if (existingPayment && existingPayment.stripeData?.clientSecret) {
      console.log('Returning existing payment intent:', {
        paymentIntentId: existingPayment.stripeData.paymentIntentId,
        amount: validatedData.amount,
        currency: validatedData.currency,
        userId: user.userId,
        description: validatedData.description
      })

      return NextResponse.json({
        success: true,
        clientSecret: existingPayment.stripeData.clientSecret,
        paymentIntentId: existingPayment.stripeData.paymentIntentId,
        amount: validatedData.amount,
        currency: validatedData.currency
      })
    }

    // Additional check: Look for any payment with same metadata (even if different status)
    // to handle cases where webhook already processed one of the duplicates
    const anyExistingPayment = await Payment.findOne({
      userId: user.userId,
      provider: 'stripe',
      'amount.value': validatedData.amount,
      'amount.currency': validatedData.currency,
      description: validatedData.description,
      'metadata.type': validatedData.metadata?.type,
      'metadata.currentSubscriptionId': validatedData.metadata?.currentSubscriptionId,
      'metadata.newPlanId': validatedData.metadata?.newPlanId,
      // Check if created within last 2 minutes
      createdAt: { $gte: new Date(Date.now() - 2 * 60 * 1000) }
    }).sort({ createdAt: -1 })

    if (anyExistingPayment && anyExistingPayment.stripeData?.clientSecret) {
      console.log('Returning existing payment intent (any status):', {
        paymentIntentId: anyExistingPayment.stripeData.paymentIntentId,
        amount: validatedData.amount,
        currency: validatedData.currency,
        userId: user.userId,
        description: validatedData.description,
        status: anyExistingPayment.status
      })

      return NextResponse.json({
        success: true,
        clientSecret: anyExistingPayment.stripeData.clientSecret,
        paymentIntentId: anyExistingPayment.stripeData.paymentIntentId,
        amount: validatedData.amount,
        currency: validatedData.currency
      })
    }

    // Get Stripe service from active gateway
    const stripeService = await StripeService.fromActiveGateway()
    
    // Create Payment Intent
    const paymentIntent = await stripeService.createPaymentIntent({
      amount: StripeService.formatAmount(validatedData.amount, validatedData.currency),
      currency: validatedData.currency,
      description: validatedData.description,
      customer_email: validatedData.customerEmail,
      metadata: {
        ...validatedData.metadata,
        userId: user.userId,
        customerEmail: validatedData.customerEmail || '',
        customerName: validatedData.customerName || '',
        createdAt: new Date().toISOString(),
      },
    })

    // Save payment to database (with pending status)
    const payment = new Payment({
      provider: 'stripe',
      externalPaymentId: paymentIntent.id,
      userId: user.userId,
      gatewayId: (await StripeService.getActiveGateway())._id,
      amount: {
        value: validatedData.amount,
        currency: validatedData.currency
      },
      description: validatedData.description,
      status: 'pending',
      metadata: validatedData.metadata || {},
      stripeData: {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        paymentStatus: paymentIntent.status
      }
    })

    await payment.save()

    // Immediate cleanup: Remove any other pending payments with same details created in last 30 seconds
    // This handles the case where multiple requests created payments simultaneously
    try {
      const duplicatePayments = await Payment.find({
        _id: { $ne: payment._id }, // Exclude the payment we just created
        userId: user.userId,
        provider: 'stripe',
        status: 'pending',
        'amount.value': validatedData.amount,
        'amount.currency': validatedData.currency,
        description: validatedData.description,
        createdAt: { $gte: new Date(Date.now() - 30 * 1000) }
      })

      if (duplicatePayments.length > 0) {
        console.log(`Found ${duplicatePayments.length} duplicate payments, cleaning up...`)
        await Payment.deleteMany({
          _id: { $in: duplicatePayments.map(p => p._id) }
        })
        console.log(`Cleaned up ${duplicatePayments.length} duplicate payments`)
      }
    } catch (cleanupError) {
      console.warn('Failed to cleanup duplicate payments:', cleanupError)
    }

    // Clean up old pending payments (older than 1 hour) to prevent database bloat
    try {
      await Payment.deleteMany({
        userId: user.userId,
        provider: 'stripe',
        status: 'pending',
        createdAt: { $lt: new Date(Date.now() - 60 * 60 * 1000) }
      })
    } catch (cleanupError) {
      console.warn('Failed to cleanup old pending payments:', cleanupError)
    }

    // Log payment intent creation
    console.log('Stripe Payment Intent created:', {
      paymentIntentId: paymentIntent.id,
      amount: validatedData.amount,
      currency: validatedData.currency,
      userId: user.userId,
      description: validatedData.description
    })

    // Return client secret for frontend
    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: validatedData.amount,
      currency: validatedData.currency
    })

  } catch (error) {
    console.error('Error creating Stripe Payment Intent:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création du Payment Intent' },
      { status: 500 }
    )
  }
} 