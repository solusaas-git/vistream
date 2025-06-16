import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectToDatabase from '@/lib/mongoose'
import Subscription from '@/models/Subscription'
import Plan from '@/models/Plan'
import Payment from '@/models/Payment'
import User from '@/models/User'
import { verifyToken } from '@/lib/auth'

const upgradeSchema = z.object({
  newPlanId: z.string().min(1, "Le nouveau plan est requis"),
  paymentProvider: z.enum(['stripe', 'mollie']).optional(),
  isRenewal: z.boolean().optional()
})

interface PlanPricing {
  price: number
  period: string
  periodInDays: number
}

// Helper function to parse plan pricing
function parsePlanPricing(planPrice: string, planPeriod: string): PlanPricing {
  // Extract numeric value from price string (e.g., "15€" -> 15, "120,99€" -> 120.99)
  const price = parseFloat(planPrice.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
  
  // Calculate period in days
  let periodInDays = 30 // Default to monthly
  if (planPeriod.includes('12') || planPeriod.includes('année') || planPeriod.includes('an')) {
    periodInDays = 365
  } else if (planPeriod.includes('24')) {
    periodInDays = 730 // 2 years
  }
  
  return {
    price,
    period: planPeriod,
    periodInDays
  }
}

// Calculate upgrade cost - full plan price (no proration)
function calculateUpgradeCost(
  currentPlan: PlanPricing,
  newPlan: PlanPricing,
  daysRemaining: number
): number {
  // Return the full price of the new plan
  return newPlan.price
}

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
    const validatedData = upgradeSchema.parse(body)

    // Get current active subscription
    const currentSubscription = await Subscription.findOne({
      userId: user._id,
      status: 'active'
    }).sort({ createdAt: -1 })

    if (!currentSubscription) {
      return NextResponse.json(
        { success: false, error: 'Aucun abonnement actif trouvé' },
        { status: 404 }
      )
    }

    // Get new plan details
    const newPlan = await Plan.findById(validatedData.newPlanId)
    if (!newPlan || !newPlan.isActive) {
      return NextResponse.json(
        { success: false, error: 'Plan non trouvé ou inactif' },
        { status: 404 }
      )
    }

    // Check if it's actually an upgrade (prevent downgrade for now)
    // Allow same plan for renewals
    const currentPlanPricing = parsePlanPricing(currentSubscription.planPrice, currentSubscription.planPeriod)
    const newPlanPricing = parsePlanPricing(newPlan.price, newPlan.period)

    if (!validatedData.isRenewal && newPlanPricing.price <= currentPlanPricing.price) {
      return NextResponse.json(
        { success: false, error: 'Vous ne pouvez que passer à un plan supérieur' },
        { status: 400 }
      )
    }

    // Calculate days remaining in current subscription
    const now = new Date()
    const endDate = currentSubscription.endDate ? new Date(currentSubscription.endDate) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

    // Allow renewals for expired subscriptions, but not upgrades
    if (daysRemaining <= 0 && !validatedData.isRenewal) {
      return NextResponse.json(
        { success: false, error: 'Votre abonnement actuel a expiré. Vous pouvez le renouveler.' },
        { status: 400 }
      )
    }

    // Calculate upgrade cost
    const upgradeCost = calculateUpgradeCost(currentPlanPricing, newPlanPricing, daysRemaining)

    let upgradePayment = null

    // Only create payment record if payment provider is specified
    if (validatedData.paymentProvider) {
      // Get the payment gateway for the selected provider
      const PaymentGateway = (await import('@/models/PaymentGateway')).default
      const paymentGateway = await PaymentGateway.findOne({
        provider: validatedData.paymentProvider,
        isActive: true
      })

      if (!paymentGateway) {
        return NextResponse.json(
          { success: false, error: `Aucune passerelle de paiement active trouvée pour ${validatedData.paymentProvider}` },
          { status: 404 }
        )
      }

      // Create payment record for the upgrade
      upgradePayment = new Payment({
        provider: validatedData.paymentProvider,
        externalPaymentId: `upgrade-${Date.now()}-${user._id}`, // Temporary ID, will be updated by payment provider
        userId: user._id,
        gatewayId: paymentGateway._id,
        amount: {
          value: upgradeCost,
          currency: 'EUR'
        },
        description: validatedData.isRenewal ? `Renouvellement ${newPlan.name}` : `Mise à niveau vers ${newPlan.name}`,
        status: 'pending',
        metadata: {
          type: validatedData.isRenewal ? 'subscription_renewal' : 'subscription_upgrade',
          currentSubscriptionId: (currentSubscription._id as any).toString(),
          newPlanId: newPlan._id.toString(),
          daysRemaining,
          currentPlan: currentSubscription.planName,
          newPlan: newPlan.name,
          upgradeCost,
          userId: user._id.toString(),
          isRenewal: validatedData.isRenewal || false
        },
        relatedType: 'subscription',
        relatedId: (currentSubscription._id as any)
      })

      await upgradePayment.save()
    }

    // Return upgrade details and payment information
    return NextResponse.json({
      success: true,
      data: {
        upgrade: {
          currentSubscriptionId: (currentSubscription._id as any).toString(),
          currentPlan: {
            id: currentSubscription.planId,
            name: currentSubscription.planName,
            price: currentSubscription.planPrice,
            period: currentSubscription.planPeriod
          },
          newPlan: {
            id: newPlan._id,
            name: newPlan.name,
            price: newPlan.price,
            period: newPlan.period
          },
          daysRemaining,
          upgradeCost,
          currency: 'EUR'
        },
        payment: upgradePayment ? {
          id: upgradePayment._id,
          amount: upgradeCost,
          currency: 'EUR',
          description: upgradePayment.description,
          status: 'pending'
        } : {
          id: null,
          amount: upgradeCost,
          currency: 'EUR',
          description: `Mise à niveau vers ${newPlan.name}`,
          status: 'pending'
        }
      },
      message: 'Mise à niveau préparée. Vous paierez le prix complet du nouveau plan et votre abonnement sera étendu.'
    })

  } catch (error) {
    console.error('Error processing subscription upgrade:', error)
    
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
      { success: false, error: 'Erreur lors de la préparation de la mise à niveau' },
      { status: 500 }
    )
  }
} 