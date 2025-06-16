import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongoose'
import Subscription from '@/models/Subscription'
import Payment from '@/models/Payment'

export async function POST(request: NextRequest) {
  try {
    const { paymentId, subscriptionId } = await request.json()

    if (!paymentId || !subscriptionId) {
      return NextResponse.json(
        { error: 'Payment ID and Subscription ID are required' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Find the payment to verify it's completed
    const payment = await Payment.findById(paymentId)
    if (!payment || payment.status !== 'completed') {
      return NextResponse.json(
        { error: 'Payment not found or not completed' },
        { status: 400 }
      )
    }

    // Find and update the subscription
    const subscription = await Subscription.findById(subscriptionId)
    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // Activate the subscription
    subscription.status = 'active'
    
    // Set end date based on plan period
    const startDate = new Date()
    let endDate = new Date(startDate)
    
    if (subscription.planPeriod === 'mois') {
      endDate.setMonth(endDate.getMonth() + 1)
    } else if (subscription.planPeriod === 'année') {
      endDate.setFullYear(endDate.getFullYear() + 1)
    }
    
    subscription.startDate = startDate
    subscription.endDate = endDate
    
    await subscription.save()

    console.log('Subscription activated:', {
      subscriptionId: subscription._id,
      userId: subscription.userId,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate
    })

    return NextResponse.json({
      success: true,
      message: 'Subscription activated successfully',
      subscription: {
        id: subscription._id,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate
      }
    })

  } catch (error) {
    console.error('Error activating subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 