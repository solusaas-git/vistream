import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectToDatabase from '@/lib/mongoose'
import Subscription from '@/models/Subscription'
import Plan from '@/models/Plan'
import Payment from '@/models/Payment'
import User from '@/models/User'
import { verifyToken } from '@/lib/auth'

const completeUpgradeSchema = z.object({
  paymentId: z.string().min(1, "L'ID du paiement est requis")
})

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token d\'authentification manquant' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Token invalide' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    // Get user
    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const validatedData = completeUpgradeSchema.parse(body)

    // Get the payment record - handle both internal ID and external payment intent ID
    let payment = await Payment.findById(validatedData.paymentId).catch(() => null)
    
    // If not found by ID, try to find by external payment intent ID (for Stripe)
    if (!payment) {
      payment = await Payment.findOne({
        $or: [
          { 'stripeData.paymentIntentId': validatedData.paymentId },
          { externalPaymentId: validatedData.paymentId }
        ]
      })
    }
    
    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Paiement non trouvé' },
        { status: 404 }
      )
    }

    // Verify payment belongs to user
    if (payment.userId.toString() !== user._id.toString()) {
      return NextResponse.json(
        { success: false, error: 'Paiement non autorisé' },
        { status: 403 }
      )
    }

    // Check if payment is completed or if upgrade was already processed by webhook
    if (payment.status !== 'completed' && !payment.isProcessed) {
      return NextResponse.json(
        { success: false, error: 'Le paiement n\'est pas encore complété' },
        { status: 400 }
      )
    }

    // If already processed by webhook, just return success
    if (payment.isProcessed) {
      const currentSubscription = await Subscription.findById(payment.metadata.currentSubscriptionId)
      if (currentSubscription) {
        return NextResponse.json({
          success: true,
          data: {
            subscription: {
              id: currentSubscription._id,
              planName: currentSubscription.planName,
              planPrice: currentSubscription.planPrice,
              planPeriod: currentSubscription.planPeriod,
              status: currentSubscription.status,
              startDate: currentSubscription.startDate,
              endDate: currentSubscription.endDate
            },
            payment: {
              id: payment._id,
              amount: payment.amount?.value || 0,
              currency: payment.amount?.currency || 'EUR',
              status: payment.status,
              description: payment.description
            }
          },
          message: payment.metadata?.isRenewal ? 'Renouvellement déjà effectué avec succès !' : 'Mise à niveau déjà effectuée avec succès !'
        })
      }
    }

    // Verify this is an upgrade or renewal payment
    if (payment.metadata?.type !== 'subscription_upgrade' && payment.metadata?.type !== 'subscription_renewal') {
      return NextResponse.json(
        { success: false, error: 'Ce paiement n\'est pas une mise à niveau ou un renouvellement d\'abonnement' },
        { status: 400 }
      )
    }

    const isRenewal = payment.metadata?.type === 'subscription_renewal'

    // Get current subscription
    const currentSubscription = await Subscription.findById(payment.metadata.currentSubscriptionId)
    if (!currentSubscription) {
      return NextResponse.json(
        { success: false, error: 'Abonnement actuel non trouvé' },
        { status: 404 }
      )
    }

    // Get new plan
    const newPlan = await Plan.findById(payment.metadata.newPlanId)
    if (!newPlan) {
      return NextResponse.json(
        { success: false, error: 'Nouveau plan non trouvé' },
        { status: 404 }
      )
    }

    // Update the subscription with new plan details
    currentSubscription.planId = newPlan._id.toString()
    currentSubscription.planName = newPlan.name
    currentSubscription.planPrice = newPlan.price
    currentSubscription.planPeriod = newPlan.period
    
    // Calculate new end date based on renewal vs upgrade
    const currentEndDate = currentSubscription.endDate || new Date()
    const now = new Date()
    
    let newEndDate
    if (isRenewal && currentEndDate > now) {
      // For renewals, extend from current end date if not expired
      newEndDate = new Date(currentEndDate)
    } else {
      // For upgrades or expired renewals, start from now
      newEndDate = new Date(now)
    }
    
    // Add the period duration
    if (newPlan.period.includes('12') || newPlan.period.includes('année') || newPlan.period.includes('an')) {
      newEndDate.setFullYear(newEndDate.getFullYear() + 1)
    } else if (newPlan.period.includes('24')) {
      newEndDate.setFullYear(newEndDate.getFullYear() + 2)
    } else {
      // Default to monthly
      newEndDate.setMonth(newEndDate.getMonth() + 1)
    }
    
    currentSubscription.endDate = newEndDate
    currentSubscription.status = 'active' // Ensure subscription is active
    
    await currentSubscription.save()

    // Mark payment as processed if not already done by webhook
    if (!payment.isProcessed) {
      payment.isProcessed = true
      payment.processedAt = new Date()
      await payment.save()
    }

    console.log(`Subscription ${isRenewal ? 'renewal' : 'upgrade'} completed:`, {
      userId: user._id,
      subscriptionId: currentSubscription._id,
      oldPlan: payment.metadata.currentPlan,
      newPlan: newPlan.name,
      paymentId: payment._id,
      cost: payment.amount?.value || 0,
      newEndDate: newEndDate.toISOString(),
      isRenewal
    })

    return NextResponse.json({
      success: true,
      data: {
        subscription: {
          id: currentSubscription._id,
          planName: currentSubscription.planName,
          planPrice: currentSubscription.planPrice,
          planPeriod: currentSubscription.planPeriod,
          status: currentSubscription.status,
          startDate: currentSubscription.startDate,
          endDate: currentSubscription.endDate
        },
        payment: {
          id: payment._id,
          amount: payment.amount?.value || 0,
          currency: payment.amount?.currency || 'EUR',
          status: payment.status,
          description: payment.description
        }
      },
      message: isRenewal ? 'Renouvellement effectué avec succès !' : 'Mise à niveau effectuée avec succès !'
    })

  } catch (error) {
    console.error('Error completing subscription upgrade:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Données invalides', 
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la finalisation de la mise à niveau' },
      { status: 500 }
    )
  }
} 