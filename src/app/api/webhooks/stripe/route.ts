import { NextRequest, NextResponse } from 'next/server'
import { StripeService } from '@/lib/stripe'
import Payment from '@/models/Payment'
import connectToDatabase from '@/lib/mongoose'
import Stripe from 'stripe'
import Subscription from '@/models/Subscription'

export async function POST(request: NextRequest) {
  console.log('🔔 Stripe webhook received')
  
  try {
    // Get the raw body
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      console.error('❌ Missing Stripe signature')
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      )
    }

    // Get the active Stripe gateway to get webhook secret
    const gateway = await StripeService.getActiveGateway()
    const webhookSecret = gateway.configuration?.webhookSecret

    if (!webhookSecret) {
      console.error('❌ Webhook secret not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 400 }
      )
    }

    // Verify the webhook signature
    let event: Stripe.Event
    try {
      event = StripeService.verifyWebhookSignature(body, signature, webhookSecret)
      console.log('✅ Webhook signature verified:', event.type)
    } catch (error) {
      console.error('❌ Webhook signature verification failed:', error)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Connect to database
    await connectToDatabase()

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        console.log(`📋 Subscription event: ${event.type}`)
        // Handle subscription events if needed
        break
      
      default:
        console.log(`🔍 Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('❌ Stripe webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle successful checkout session completion
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('💳 Processing checkout session completed:', session.id)
  
  try {
    // Find payment by session ID
    const payment = await Payment.findOne({
      'stripeData.sessionId': session.id
    })

    if (!payment) {
      console.error('❌ Payment not found for session:', session.id)
      return
    }

    // Update payment status
    payment.status = 'completed'
    payment.paidAt = new Date()
    
    // Update Stripe data
    if (payment.stripeData) {
      payment.stripeData.paymentIntentId = session.payment_intent as string
      payment.stripeData.customerId = session.customer as string
      payment.stripeData.paymentStatus = session.payment_status
    }

    await payment.save()
    console.log('✅ Payment updated successfully:', payment._id)

    // Handle subscription activation or upgrade
    if (payment.userId) {
                  // Check if this is an upgrade or renewal payment
            if (payment.metadata?.type === 'subscription_upgrade' || payment.metadata?.type === 'subscription_renewal') {
                  const isRenewal = payment.metadata?.type === 'subscription_renewal'
          console.log(`🔄 Processing subscription ${isRenewal ? 'renewal' : 'upgrade'}`)
        console.log('Upgrade metadata:', {
          currentSubscriptionId: payment.metadata.currentSubscriptionId,
          newPlanId: payment.metadata.newPlanId,
          currentPlan: payment.metadata.currentPlan,
          newPlan: payment.metadata.newPlan
        })
        
        // Get current subscription and new plan
        const currentSubscription = await Subscription.findById(payment.metadata.currentSubscriptionId)
        const Plan = (await import('@/models/Plan')).default
        const newPlan = await Plan.findById(payment.metadata.newPlanId)
        
        console.log('Found subscription:', currentSubscription ? 'Yes' : 'No')
        console.log('Found new plan:', newPlan ? 'Yes' : 'No')
        
        if (currentSubscription && newPlan) {
          // Update subscription with new plan details
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
          
          console.log(`✅ Subscription ${isRenewal ? 'renewed' : 'upgraded'}:`, {
            subscriptionId: currentSubscription._id,
            oldPlan: payment.metadata.currentPlan,
            newPlan: newPlan.name,
            newEndDate: newEndDate.toISOString(),
            isRenewal
          })
        }
      } else {
        // Regular subscription activation
        const subscription = await Subscription.findOne({ 
          userId: payment.userId,
          status: 'pending'
        }).sort({ createdAt: -1 }) // Get the most recent pending subscription

        if (subscription) {
          subscription.status = 'active'
          subscription.startDate = new Date()
          await subscription.save()
          console.log('✅ Subscription activated:', subscription._id)
        } else {
          console.log('ℹ️ No pending subscription found for user:', payment.userId)
        }
      }
    }

  } catch (error) {
    console.error('❌ Error handling checkout session completed:', error)
  }
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('�� Processing payment intent succeeded:', paymentIntent.id)
  
  try {
    // Find payment by payment intent ID
    const payment = await Payment.findOne({
      'stripeData.paymentIntentId': paymentIntent.id
    })

    if (!payment) {
      console.error('❌ Payment not found for payment intent:', paymentIntent.id)
      return
    }

    // Update payment status
    payment.status = 'completed'
    payment.paidAt = new Date()
    
    // Update Stripe data
    if (payment.stripeData) {
      payment.stripeData.paymentStatus = paymentIntent.status
      // Note: receipt_url is available on charge objects, not payment intent
      payment.stripeData.receiptUrl = null
    }

    // Mark as processed to avoid duplicate processing
    if (!payment.isProcessed) {
      payment.isProcessed = true
      payment.processedAt = new Date()
    }

    await payment.save()
    console.log('✅ Payment updated successfully:', payment._id)

    // Handle subscription activation or upgrade
    if (payment.userId) {
      // Check if this is an upgrade or renewal payment
      if (payment.metadata?.type === 'subscription_upgrade' || payment.metadata?.type === 'subscription_renewal') {
        const isRenewal = payment.metadata?.type === 'subscription_renewal'
        console.log(`🔄 Processing subscription ${isRenewal ? 'renewal' : 'upgrade'}`)
        console.log('Upgrade metadata:', {
          currentSubscriptionId: payment.metadata.currentSubscriptionId,
          newPlanId: payment.metadata.newPlanId,
          currentPlan: payment.metadata.currentPlan,
          newPlan: payment.metadata.newPlan
        })
        
        // Get current subscription and new plan
        const currentSubscription = await Subscription.findById(payment.metadata.currentSubscriptionId)
        const Plan = (await import('@/models/Plan')).default
        const newPlan = await Plan.findById(payment.metadata.newPlanId)
        
        console.log('Found subscription:', currentSubscription ? 'Yes' : 'No')
        console.log('Found new plan:', newPlan ? 'Yes' : 'No')
        
        if (currentSubscription && newPlan) {
          // Update subscription with new plan details
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
          
          console.log(`✅ Subscription ${isRenewal ? 'renewed' : 'upgraded'}:`, {
            subscriptionId: currentSubscription._id,
            oldPlan: payment.metadata.currentPlan,
            newPlan: newPlan.name,
            newEndDate: newEndDate.toISOString(),
            isRenewal
          })
        }
      } else {
        // Regular subscription activation
        const subscription = await Subscription.findOne({ 
          userId: payment.userId,
          status: 'pending'
        }).sort({ createdAt: -1 }) // Get the most recent pending subscription

        if (subscription) {
          subscription.status = 'active'
          subscription.startDate = new Date()
          await subscription.save()
          console.log('✅ Subscription activated:', subscription._id)
        } else {
          console.log('ℹ️ No pending subscription found for user:', payment.userId)
        }
      }
    }

  } catch (error) {
    console.error('❌ Error handling payment intent succeeded:', error)
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('❌ Processing payment intent failed:', paymentIntent.id)
  
  try {
    // Find payment by payment intent ID
    const payment = await Payment.findOne({
      'stripeData.paymentIntentId': paymentIntent.id
    })

    if (!payment) {
      console.error('❌ Payment not found for payment intent:', paymentIntent.id)
      return
    }

    // Update payment status
    payment.status = 'failed'
    
    // Update Stripe data
    if (payment.stripeData) {
      payment.stripeData.paymentStatus = paymentIntent.status
      payment.stripeData.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed'
    }

    await payment.save()
    console.log('✅ Payment failure updated:', payment._id)

  } catch (error) {
    console.error('❌ Error handling payment intent failed:', error)
  }
}

/**
 * Handle successful invoice payment (for subscriptions)
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('📄 Processing invoice payment succeeded:', invoice.id)
  
  try {
    // Find payment by invoice ID or subscription ID
    const payment = await Payment.findOne({
      $or: [
        { 'stripeData.invoiceId': invoice.id },
        { 'stripeData.subscriptionId': (invoice as any).subscription }
      ]
    })

    if (!payment) {
      console.log('ℹ️ No payment found for invoice:', invoice.id)
      return
    }

    // Update payment status
    payment.status = 'completed'
    payment.paidAt = new Date()
    
    // Update Stripe data
    if (payment.stripeData) {
      payment.stripeData.invoiceId = invoice.id
      payment.stripeData.paymentStatus = 'succeeded'
    }

    await payment.save()
    console.log('✅ Invoice payment updated:', payment._id)

  } catch (error) {
    console.error('❌ Error handling invoice payment succeeded:', error)
  }
}

/**
 * Handle failed invoice payment (for subscriptions)
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('❌ Processing invoice payment failed:', invoice.id)
  
  try {
    // Find payment by invoice ID or subscription ID
    const payment = await Payment.findOne({
      $or: [
        { 'stripeData.invoiceId': invoice.id },
        { 'stripeData.subscriptionId': (invoice as any).subscription }
      ]
    })

    if (!payment) {
      console.log('ℹ️ No payment found for invoice:', invoice.id)
      return
    }

    // Update payment status
    payment.status = 'failed'
    
    // Update Stripe data
    if (payment.stripeData) {
      payment.stripeData.invoiceId = invoice.id
      payment.stripeData.paymentStatus = 'failed'
      payment.stripeData.failureReason = 'Invoice payment failed'
    }

    await payment.save()
    console.log('✅ Invoice payment failure updated:', payment._id)

  } catch (error) {
    console.error('❌ Error handling invoice payment failed:', error)
  }
} 