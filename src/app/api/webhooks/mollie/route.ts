import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongoose'
import PaymentGateway from '@/models/PaymentGateway'
import Payment from '@/models/Payment'

// Mollie webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('mollie-signature')
    
    // Parse the webhook payload
    let webhookData
    try {
      webhookData = JSON.parse(body)
    } catch (error) {
      console.error('Invalid JSON in Mollie webhook:', error)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
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
    let payment = await Payment.findOne({ molliePaymentId: paymentData.id })
    
    if (!payment) {
      // Create new payment record
      payment = new Payment({
        molliePaymentId: paymentData.id,
        userId: paymentData.metadata?.userId,
        gatewayId: mollieGateway._id,
        amount: {
          value: parseFloat(paymentData.amount.value),
          currency: paymentData.amount.currency
        },
        description: paymentData.description,
        status: paymentData.status,
        method: paymentData.method,
        redirectUrl: paymentData.redirectUrl,
        webhookUrl: paymentData.webhookUrl,
        checkoutUrl: paymentData._links?.checkout?.href,
        metadata: paymentData.metadata || {},
        mollieCreatedAt: new Date(paymentData.createdAt),
        mollieExpiresAt: paymentData.expiresAt ? new Date(paymentData.expiresAt) : undefined,
        webhookProcessedAt: new Date(),
        webhookAttempts: 1
      })
    } else {
      // Update existing payment record
      payment.status = paymentData.status
      payment.method = paymentData.method
      payment.webhookProcessedAt = new Date()
      payment.webhookAttempts += 1
      
      // Update paid timestamp if payment was successful
      if (paymentData.status === 'paid' && !payment.molliePaidAt) {
        payment.molliePaidAt = new Date()
      }
    }

    await payment.save()

    // Handle status-specific logic
    switch (paymentData.status) {
      case 'paid':
        console.log(`Payment ${paymentData.id} was successful`)
        
        if (!payment.isProcessed) {
          // Mark as processed to avoid duplicate processing
          payment.isProcessed = true
          payment.processedAt = new Date()
          await payment.save()
          
          // TODO: Add your business logic here:
          // - Update subscription status
          // - Send confirmation email
          // - Trigger fulfillment
          // - Update user account
          
          console.log(`Payment ${paymentData.id} processed successfully`)
        }
        break
      
      case 'failed':
      case 'canceled':
      case 'expired':
        console.log(`Payment ${paymentData.id} failed with status: ${paymentData.status}`)
        
        // TODO: Add failure handling:
        // - Send failure notification
        // - Update order status
        // - Log for analytics
        break
      
      case 'pending':
        console.log(`Payment ${paymentData.id} is pending`)
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