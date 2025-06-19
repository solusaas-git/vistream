import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectToDatabase from '@/lib/mongoose'
import User from '@/models/User'
import Payment from '@/models/Payment'
import Subscription from '@/models/Subscription'
import Plan from '@/models/Plan'

// Simple JWT verification for session management
async function getUserFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('next-auth.session-token')?.value || 
                  request.cookies.get('__Secure-next-auth.session-token')?.value

    if (!token) return null

    const decoded = jwt.decode(token) as any
    if (!decoded?.email) return null

    await connectToDatabase()
    return await User.findOne({ email: decoded.email })
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const { paymentId, sessionType, provider } = await request.json()

    console.log('🎯 Payment completion request:', {
      paymentId,
      sessionType,
      provider
    })

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID requis' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Find the payment
    // Build search criteria - avoid ObjectId cast error for Stripe payment intent IDs
    const searchCriteria: any[] = [
      { externalPaymentId: paymentId },
      { 'stripeData.paymentIntentId': paymentId }
    ]
    
    // Only search by _id if paymentId looks like a valid ObjectId (24 hex chars)
    if (/^[0-9a-fA-F]{24}$/.test(paymentId)) {
      searchCriteria.push({ _id: paymentId })
    }
    
    const payment = await Payment.findOne({
      $or: searchCriteria
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Paiement non trouvé' },
        { status: 404 }
      )
    }

    // Get user from payment
    const user = await User.findById(payment.userId)
    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Check if payment is completed - with retry logic for pending payments
    console.log('💳 Payment status check:', {
      paymentId: payment._id,
      status: payment.status,
      isProcessed: payment.isProcessed,
      paymentType: payment.metadata?.type,
      sessionType
    })
    
    if (payment.status !== 'completed') {
      // If payment is pending, wait a bit for webhook to process it
      if (payment.status === 'pending') {
        console.log('⏳ Payment is pending, waiting for webhook processing...')
        
        // Wait up to 10 seconds for webhook to process the payment
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
          
          // Refresh payment from database
          const updatedPayment = await Payment.findById(payment._id)
          if (updatedPayment && updatedPayment.status === 'completed') {
            console.log('✅ Payment completed after waiting:', {
              paymentId: payment._id,
              waitTime: `${i + 1} seconds`
            })
            payment.status = updatedPayment.status
            payment.isProcessed = updatedPayment.isProcessed
            break
          }
        }
        
        // Check again after waiting
        if (payment.status !== 'completed') {
          console.error('❌ Payment still not completed after waiting:', {
            paymentId: payment._id,
            currentStatus: payment.status,
            expectedStatus: 'completed'
          })
          return NextResponse.json(
            { error: 'Le paiement est en cours de traitement. Veuillez patienter quelques instants et réessayer.' },
            { status: 400 }
          )
        }
      } else {
        console.error('❌ Payment not completed:', {
          paymentId: payment._id,
          currentStatus: payment.status,
          expectedStatus: 'completed'
        })
        return NextResponse.json(
          { error: 'Paiement pas encore complété' },
          { status: 400 }
        )
      }
    }

    // Check if payment has already been processed
    if (payment.isProcessed) {
      console.log('💳 Payment already processed, checking subscription status')
      
      const paymentType = payment.metadata?.type || sessionType || 'subscription'
      
      // For new subscriptions only, check if already processed
      if (paymentType === 'subscription') {
        const existingSubscription = await Subscription.findOne({
          userId: user._id,
          status: 'active'
        })

        if (existingSubscription) {
          console.log('✅ Found existing subscription for new subscription payment')
          return NextResponse.json({
            success: true,
            message: 'Paiement déjà traité - Abonnement actif',
            subscription: existingSubscription
          })
        }
      }
      
      // For upgrades and renewals, always allow processing to extend subscription
      console.log('🔄 Continuing processing to complete the operation...')
    }

    // Determine the actual payment type from sessionType or payment metadata
    const actualPaymentType = sessionType || payment.metadata?.type || 'subscription'
    console.log('🎯 Determined payment type:', actualPaymentType)

    // For new subscriptions, create or activate subscription
    if (actualPaymentType === 'subscription') {
      // Check if user already has an active subscription to prevent duplicates
      const existingSubscription = await Subscription.findOne({
        userId: user._id,
        status: 'active'
      })

      if (existingSubscription) {
        // Mark payment as processed to prevent reprocessing
        payment.isProcessed = true
        await payment.save()

        return NextResponse.json({
          success: true,
          message: 'Abonnement déjà actif',
          subscription: existingSubscription
        })
      }

      // Find pending subscription or create new one
      let subscription = await Subscription.findOne({
        userId: user._id,
        status: 'pending'
      }).sort({ createdAt: -1 })

      if (!subscription) {
        // Extract plan information from payment metadata
        const planId = payment.metadata?.planId
        if (!planId) {
          return NextResponse.json(
            { error: 'Plan non trouvé dans les métadonnées du paiement' },
            { status: 400 }
          )
        }

        const plan = await Plan.findById(planId)
        if (!plan) {
          return NextResponse.json(
            { error: 'Plan non trouvé' },
            { status: 404 }
          )
        }

        // Create new subscription
        subscription = new Subscription({
          userId: user._id,
          planId: plan._id,
          planName: plan.name,
          planPrice: plan.price,
          planPeriod: plan.period,
          status: 'active',
          startDate: new Date(),
          autoRenew: true
        })

        // Calculate end date based on plan period
        const endDate = new Date()
        if (plan.period.includes('12') || plan.period.includes('année') || plan.period.includes('an')) {
          endDate.setFullYear(endDate.getFullYear() + 1)
        } else if (plan.period.includes('24')) {
          endDate.setFullYear(endDate.getFullYear() + 2)
        } else {
          // Default to monthly
          endDate.setMonth(endDate.getMonth() + 1)
        }
        subscription.endDate = endDate
      } else {
        // Activate existing pending subscription
        subscription.status = 'active'
        subscription.startDate = new Date()
      }

      await subscription.save()

      // Mark payment as processed
      payment.isProcessed = true
      await payment.save()

      console.log('✅ New subscription activated:', {
        userId: user._id,
        subscriptionId: subscription._id,
        planName: subscription.planName,
        paymentId: payment._id
      })

      return NextResponse.json({
        success: true,
        message: 'Abonnement activé avec succès',
        subscription
      })
    }

    // Handle upgrades and renewals
    if (actualPaymentType === 'upgrade' || actualPaymentType === 'renewal') {
      console.log(`🔄 Processing ${actualPaymentType} for user ${user._id}`)
      
      // Get current subscription
      const currentSubscription = await Subscription.findOne({
        userId: user._id,
        status: 'active'
      })

      console.log('📋 Current subscription found:', currentSubscription ? {
        id: currentSubscription._id,
        planName: currentSubscription.planName,
        planId: currentSubscription.planId,
        status: currentSubscription.status
      } : 'None')

      if (!currentSubscription) {
        console.error('❌ No active subscription found for upgrade/renewal')
        return NextResponse.json(
          { error: 'Aucun abonnement actif trouvé pour l\'upgrade/renewal' },
          { status: 404 }
        )
      }

      // Get new plan from payment metadata
      const newPlanId = payment.metadata?.planId
      if (!newPlanId) {
        return NextResponse.json(
          { error: 'Plan non trouvé dans les métadonnées du paiement' },
          { status: 400 }
        )
      }

      const newPlan = await Plan.findById(newPlanId)
      if (!newPlan) {
        return NextResponse.json(
          { error: 'Nouveau plan non trouvé' },
          { status: 404 }
        )
      }

      if (actualPaymentType === 'upgrade') {
        // Update subscription to new plan
        currentSubscription.planId = newPlan._id
        currentSubscription.planName = newPlan.name
        currentSubscription.planPrice = newPlan.price
        currentSubscription.planPeriod = newPlan.period
        
        // For upgrades, extend the end date from current date
        const newEndDate = new Date()
        if (newPlan.period.includes('12') || newPlan.period.includes('année') || newPlan.period.includes('an')) {
          newEndDate.setFullYear(newEndDate.getFullYear() + 1)
        } else if (newPlan.period.includes('24')) {
          newEndDate.setFullYear(newEndDate.getFullYear() + 2)
        } else {
          // Default to monthly
          newEndDate.setMonth(newEndDate.getMonth() + 1)
        }
        currentSubscription.endDate = newEndDate
        
        console.log('✅ Subscription upgraded:', {
          userId: user._id,
          subscriptionId: currentSubscription._id,
          oldPlan: payment.metadata?.currentPlanId,
          newPlan: newPlan.name,
          newEndDate: newEndDate
        })
      } else {
        // Renewal - extend subscription from current end date
        const currentEndDate = new Date(currentSubscription.endDate || new Date())
        const renewalEndDate = new Date(currentEndDate) // Start from current end date
        
        if (newPlan.period.includes('12') || newPlan.period.includes('année') || newPlan.period.includes('an')) {
          renewalEndDate.setFullYear(renewalEndDate.getFullYear() + 1)
        } else if (newPlan.period.includes('24')) {
          renewalEndDate.setFullYear(renewalEndDate.getFullYear() + 2)
        } else {
          // Default to monthly
          renewalEndDate.setMonth(renewalEndDate.getMonth() + 1)
        }
        currentSubscription.endDate = renewalEndDate
        
        console.log('✅ Subscription renewed:', {
          userId: user._id,
          subscriptionId: currentSubscription._id,
          planName: currentSubscription.planName,
          oldEndDate: currentEndDate.toISOString(),
          newEndDate: renewalEndDate.toISOString()
        })
      }

      await currentSubscription.save()

      // Mark payment as processed
      payment.isProcessed = true
      await payment.save()

      return NextResponse.json({
        success: true,
        message: actualPaymentType === 'upgrade' ? 'Abonnement mis à niveau avec succès' : 'Abonnement renouvelé avec succès',
        subscription: currentSubscription
      })
    }

    // If we reach here, this is an unsupported session type
    return NextResponse.json(
      { error: 'Type de session non supporté' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error completing payment:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 