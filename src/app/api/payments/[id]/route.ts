import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/rbac'
import { MollieService } from '@/lib/mollie'
import { StripeService } from '@/lib/stripe'
import Payment from '@/models/Payment'
import connectToDatabase from '@/lib/mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Await params in Next.js 15
    const { id } = await params
    const paymentId = id

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'ID de paiement requis' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // First, try to find the payment in our database
    const dbPayment = await Payment.findOne({
      $or: [
        { externalPaymentId: paymentId },
        { 'mollieData.paymentId': paymentId },
        { 'stripeData.sessionId': paymentId },
        { 'stripeData.paymentIntentId': paymentId }
      ]
    })

    if (!dbPayment) {
      return NextResponse.json(
        { success: false, error: 'Paiement non trouvé' },
        { status: 404 }
      )
    }

    let providerPayment
    let normalizedPayment

    try {
      // Fetch fresh data from the payment provider
      switch (dbPayment.provider) {
        case 'mollie':
          const mollieService = await MollieService.fromActiveGateway()
          providerPayment = await mollieService.getPayment(dbPayment.externalPaymentId)
          
          normalizedPayment = {
            id: providerPayment.id,
            provider: 'mollie',
            status: providerPayment.status === 'paid' ? 'completed' : 
                   providerPayment.status === 'open' ? 'pending' :
                   providerPayment.status === 'canceled' ? 'cancelled' : providerPayment.status,
            amount: {
              value: parseFloat(providerPayment.amount.value),
              currency: providerPayment.amount.currency
            },
            description: providerPayment.description,
            metadata: providerPayment.metadata,
            createdAt: providerPayment.createdAt,
            expiresAt: providerPayment.expiresAt,
            redirectUrl: providerPayment.redirectUrl,
            webhookUrl: providerPayment.webhookUrl,
            checkoutUrl: providerPayment._links?.checkout?.href
          }
          break

        case 'stripe':
          const stripeService = await StripeService.fromActiveGateway()
          
          // Try to get session first, then payment intent
          if (dbPayment.stripeData?.sessionId) {
            const stripeSession = await stripeService.getCheckoutSession(dbPayment.stripeData.sessionId)
            
            normalizedPayment = {
              id: stripeSession.id,
              provider: 'stripe',
              status: stripeSession.payment_status === 'paid' ? 'completed' : 'pending',
              amount: {
                value: StripeService.formatAmountFromStripe(stripeSession.amount_total || 0, stripeSession.currency || 'eur'),
                currency: (stripeSession.currency || 'eur').toUpperCase()
              },
              description: dbPayment.description,
              metadata: stripeSession.metadata,
              createdAt: new Date(stripeSession.created * 1000).toISOString(),
              expiresAt: stripeSession.expires_at ? new Date(stripeSession.expires_at * 1000).toISOString() : null,
              checkoutUrl: stripeSession.url,
              paymentIntentId: stripeSession.payment_intent as string,
              customerId: stripeSession.customer as string
            }
          } else if (dbPayment.stripeData?.paymentIntentId) {
            const paymentIntent = await stripeService.getPaymentIntent(dbPayment.stripeData.paymentIntentId)
            
            normalizedPayment = {
              id: paymentIntent.id,
              provider: 'stripe',
              status: paymentIntent.status === 'succeeded' ? 'completed' : 
                     paymentIntent.status === 'processing' ? 'pending' : 'failed',
              amount: {
                value: StripeService.formatAmountFromStripe(paymentIntent.amount, paymentIntent.currency),
                currency: paymentIntent.currency.toUpperCase()
              },
              description: paymentIntent.description || dbPayment.description,
              metadata: paymentIntent.metadata,
              createdAt: new Date(paymentIntent.created * 1000).toISOString(),
              paymentIntentId: paymentIntent.id
            }
          }
          break

        default:
          return NextResponse.json(
            { success: false, error: `Passerelle non supportée: ${dbPayment.provider}` },
            { status: 400 }
          )
      }

      // Update database with fresh status if different
      if (normalizedPayment && normalizedPayment.status !== dbPayment.status) {
        dbPayment.status = normalizedPayment.status as any
        if (normalizedPayment.status === 'completed' && !dbPayment.paidAt) {
          dbPayment.paidAt = new Date()
        }
        await dbPayment.save()
      }

      return NextResponse.json({
        success: true,
        payment: normalizedPayment || {
          id: dbPayment.externalPaymentId,
          provider: dbPayment.provider,
          status: dbPayment.status,
          amount: dbPayment.amount,
          description: dbPayment.description,
          metadata: dbPayment.metadata,
          createdAt: dbPayment.createdAt
        }
      })

    } catch (providerError) {
      console.error('Error fetching from provider:', providerError)
      
      // Return database data if provider call fails
      return NextResponse.json({
        success: true,
        payment: {
          id: dbPayment.externalPaymentId,
          provider: dbPayment.provider,
          status: dbPayment.status,
          amount: dbPayment.amount,
          description: dbPayment.description,
          metadata: dbPayment.metadata,
          createdAt: dbPayment.createdAt,
          note: 'Données depuis la base de données (erreur de synchronisation avec le fournisseur)'
        }
      })
    }

  } catch (error) {
    console.error('Error fetching payment:', error)

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
        error: 'Erreur lors de la récupération du paiement' 
      },
      { status: 500 }
    )
  }
} 