import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongoose'
import PaymentGateway from '@/models/PaymentGateway'
import Payment from '@/models/Payment'
import Subscription from '@/models/Subscription'

// Function to normalize Mollie payment status to our payment schema
function normalizePaymentStatus(mollieStatus: string): 'pending' | 'completed' | 'failed' | 'cancelled' | 'expired' | 'refunded' {
  switch (mollieStatus) {
    case 'open':
    case 'pending':
      return 'pending'
    case 'paid':
      return 'completed'
    case 'failed':
      return 'failed'
    case 'canceled':
      return 'cancelled'
    case 'expired':
      return 'expired'
    case 'authorized':
      return 'pending'
    default:
      return 'pending'
  }
}

// Mollie webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('mollie-signature')
    
    // Parse the webhook payload - Mollie can send JSON or form-encoded data
    let webhookData
    try {
      // Try JSON first
      webhookData = JSON.parse(body)
    } catch (error) {
      // If JSON parsing fails, try form-encoded format
      try {
        const urlParams = new URLSearchParams(body)
        const id = urlParams.get('id')
        if (id) {
          webhookData = { id }
          console.log('Parsed form-encoded Mollie webhook:', webhookData)
        } else {
          throw new Error('No ID found in form data')
        }
      } catch (formError) {
        console.error('Invalid webhook format (neither JSON nor form-encoded):', error)
        return NextResponse.json({ error: 'Invalid webhook format' }, { status: 400 })
      }
    }

    // Validate required fields
    if (!webhookData.id) {
      console.error('Missing ID in Mollie webhook')
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
    }

    console.log('Mollie webhook received:', {
      id: webhookData.id,
      type: webhookData.id.startsWith('event_') ? 'event' : 'payment',
      body: webhookData
    })

    await connectToDatabase()

    // Get the active Mollie gateway
    const mollieGateway = await PaymentGateway.findOne({ 
      provider: 'mollie', 
      isActive: true 
    }).select('+configuration.mollieApiKey +configuration.webhookSecret')

    if (!mollieGateway) {
      console.error('No active Mollie gateway found')
      return NextResponse.json({ error: 'No active Mollie gateway' }, { status: 404 })
    }

    // Verify webhook signature if webhook secret is configured
    if (mollieGateway.configuration?.webhookSecret && signature) {
      const crypto = require('crypto')
      const expectedSignature = crypto
        .createHmac('sha256', mollieGateway.configuration.webhookSecret)
        .update(body)
        .digest('hex')
      
      if (signature !== expectedSignature) {
        console.error('Invalid Mollie webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const mollieApiKey = mollieGateway.configuration?.mollieApiKey
    if (!mollieApiKey) {
      console.error('No Mollie API key configured')
      return NextResponse.json({ error: 'No API key configured' }, { status: 500 })
    }

    // Handle different types of webhooks
    if (webhookData.id.startsWith('event_')) {
      // This is a test event from Mollie dashboard
      console.log('Received Mollie test event:', webhookData.id)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Test event received successfully',
        eventId: webhookData.id,
        type: 'test_event'
      })
    }

    // Handle payment webhooks (tr_)
    if (!webhookData.id.startsWith('tr_')) {
      console.error('Invalid payment ID format:', webhookData.id)
      return NextResponse.json({ error: 'Invalid payment ID format' }, { status: 400 })
    }

    // Fetch payment details from Mollie API
    const mollieResponse = await fetch(`https://api.mollie.com/v2/payments/${webhookData.id}`, {
      headers: {
        'Authorization': `Bearer ${mollieApiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!mollieResponse.ok) {
      const errorText = await mollieResponse.text()
      console.error('Failed to fetch payment from Mollie:', errorText)
      return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 })
    }

    const paymentData = await mollieResponse.json()
    
    // Log the webhook for debugging
    console.log('Mollie webhook received:', {
      paymentId: paymentData.id,
      status: paymentData.status,
      amount: paymentData.amount,
      metadata: paymentData.metadata
    })

    // Here you would typically:
    // 1. Find the corresponding order/subscription in your database using paymentData.metadata
    // 2. Update the order/subscription status based on paymentData.status
    // 3. Send confirmation emails, trigger fulfillment, etc.

    // Find or create payment record in database
    let payment = await Payment.findOne({ 
      provider: 'mollie',
      externalPaymentId: paymentData.id 
    })
    
    const isNewPayment = !payment
    
    if (!payment) {
      // Create new payment record
      payment = new Payment({
        provider: 'mollie',
        externalPaymentId: paymentData.id,
        userId: paymentData.metadata?.userId,
        gatewayId: mollieGateway._id,
        amount: {
          value: parseFloat(paymentData.amount.value),
          currency: paymentData.amount.currency
        },
        description: paymentData.description || `Payment ${paymentData.id}`,
        status: normalizePaymentStatus(paymentData.status),
        method: paymentData.method,
        redirectUrl: paymentData.redirectUrl,
        webhookUrl: paymentData.webhookUrl,
        checkoutUrl: paymentData._links?.checkout?.href,
        expiresAt: paymentData.expiresAt ? new Date(paymentData.expiresAt) : undefined,
        metadata: paymentData.metadata || {},
        mollieData: {
          paymentId: paymentData.id,
          checkoutUrl: paymentData._links?.checkout?.href,
          method: paymentData.method,
          profileId: paymentData.profileId,
          settlementAmount: paymentData.settlementAmount
        },
        webhookProcessedAt: new Date(),
        webhookAttempts: 1,
        // Add tracking fields
        ipAddress: paymentData.metadata?.ipAddress,
        userAgent: paymentData.metadata?.userAgent,
        source: paymentData.metadata?.source || 'webhook'
      })
      
      console.log(`📝 Created new payment record for ${paymentData.id}`)
    } else {
      // Update existing payment record
      const oldStatus = payment.status
      const newStatus = normalizePaymentStatus(paymentData.status)
      
      payment.status = newStatus
      payment.method = paymentData.method
      payment.webhookProcessedAt = new Date()
      payment.webhookAttempts = (payment.webhookAttempts || 0) + 1
      payment.lastSyncAt = new Date()
      
      // Update paid timestamp if payment was successful
      if (paymentData.status === 'paid' && !payment.paidAt) {
        payment.paidAt = new Date()
      }
      
      // Log status changes
      if (oldStatus !== newStatus) {
        console.log(`🔄 Payment ${paymentData.id} status changed: ${oldStatus} → ${newStatus}`)
        
        // Add to status history
        if (!payment.statusHistory || payment.statusHistory.length === 0) {
          // Initialize if needed - Mongoose will handle the DocumentArray
        }
        payment.statusHistory.push({
          status: newStatus,
          timestamp: new Date(),
          source: 'webhook'
        })
      }
    }

    await payment.save()
    
    // Log payment processing
    console.log(`💾 Payment ${paymentData.id} saved to database:`, {
      id: payment._id,
      status: payment.status,
      amount: payment.amount,
      isNew: isNewPayment,
      webhookAttempts: payment.webhookAttempts
    })

    // Handle status-specific logic
    switch (paymentData.status) {
      case 'paid':
        console.log(`💳 Payment ${paymentData.id} was successful`)
        
        if (!payment.isProcessed) {
          // Mark as processed to avoid duplicate processing
          payment.isProcessed = true
          payment.processedAt = new Date()
          await payment.save()
          
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
          
          console.log(`✅ Payment ${paymentData.id} processed successfully`)
        }
        break
      
      case 'failed':
      case 'canceled':
      case 'expired':
        console.log(`❌ Payment ${paymentData.id} failed with status: ${paymentData.status}`)
        
        // TODO: Add failure handling:
        // - Send failure notification
        // - Update order status
        // - Log for analytics
        break
      
      case 'pending':
        console.log(`⏳ Payment ${paymentData.id} is pending`)
        // Payment is still being processed
        break
      
      default:
        console.log(`Unknown payment status: ${paymentData.status}`)
    }

    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      paymentId: paymentData.id,
      status: paymentData.status
    })

  } catch (error) {
    console.error('Error processing Mollie webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET method for webhook verification (Mollie sometimes sends GET requests)
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Mollie webhook endpoint is active',
    timestamp: new Date().toISOString()
  })
} 