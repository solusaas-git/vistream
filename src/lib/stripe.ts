import Stripe from 'stripe'
import PaymentGateway from '@/models/PaymentGateway'
import connectToDatabase from '@/lib/mongoose'

export interface StripePaymentData {
  amount: number // Amount in cents
  currency: string
  description: string
  customer_email?: string
  metadata?: Record<string, any>
  success_url: string
  cancel_url: string
  payment_method_types?: string[]
  mode?: 'payment' | 'subscription' | 'setup'
  automatic_tax?: {
    enabled: boolean
  }
}

export class StripeService {
  private stripe: Stripe
  private gateway: any

  constructor(secretKey: string, gateway: any) {
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-05-28.basil',
    })
    this.gateway = gateway
  }

  /**
   * Create a Stripe service instance from the active gateway
   */
  static async fromActiveGateway(): Promise<StripeService> {
    const gateway = await StripeService.getActiveGateway()
    
    if (!gateway.configuration?.stripeSecretKey) {
      throw new Error('Clé secrète Stripe non configurée')
    }

    return new StripeService(gateway.configuration.stripeSecretKey, gateway)
  }

  /**
   * Get the active Stripe gateway
   */
  static async getActiveGateway() {
    await connectToDatabase()
    
    const gateway = await PaymentGateway.findOne({ 
      provider: 'stripe', 
      isActive: true 
    }).select('+configuration.stripeSecretKey +configuration.stripePublishableKey +configuration.webhookSecret')

    if (!gateway) {
      throw new Error('Aucune passerelle Stripe active trouvée')
    }

    return gateway
  }

  /**
   * Create a Stripe Checkout Session
   */
  async createCheckoutSession(data: StripePaymentData): Promise<Stripe.Checkout.Session> {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: (data.payment_method_types || ['card']) as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
        mode: data.mode || 'payment',
        line_items: [
          {
            price_data: {
              currency: data.currency.toLowerCase(),
              product_data: {
                name: data.description,
              },
              unit_amount: data.amount, // Amount in cents
            },
            quantity: 1,
          },
        ],
        customer_email: data.customer_email,
        success_url: data.success_url,
        cancel_url: data.cancel_url,
        metadata: data.metadata || {},
        automatic_tax: data.automatic_tax,
      })

      return session
    } catch (error) {
      console.error('Stripe checkout session creation error:', error)
      throw new Error(`Erreur lors de la création de la session Stripe: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  /**
   * Create a Payment Intent (for custom checkout)
   */
  async createPaymentIntent(data: Omit<StripePaymentData, 'success_url' | 'cancel_url'>): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: data.amount,
        currency: data.currency.toLowerCase(),
        description: data.description,
        metadata: data.metadata || {},
        automatic_payment_methods: {
          enabled: true,
        },
      })

      return paymentIntent
    } catch (error) {
      console.error('Stripe payment intent creation error:', error)
      throw new Error(`Erreur lors de la création du Payment Intent: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  /**
   * Retrieve a checkout session
   */
  async getCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    try {
      return await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent', 'customer']
      })
    } catch (error) {
      console.error('Stripe session retrieval error:', error)
      throw new Error(`Erreur lors de la récupération de la session: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  /**
   * Retrieve a payment intent
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId)
    } catch (error) {
      console.error('Stripe payment intent retrieval error:', error)
      throw new Error(`Erreur lors de la récupération du Payment Intent: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  /**
   * Create a refund
   */
  async createRefund(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
    try {
      const refundData: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      }

      if (amount) {
        refundData.amount = amount
      }

      return await this.stripe.refunds.create(refundData)
    } catch (error) {
      console.error('Stripe refund creation error:', error)
      throw new Error(`Erreur lors de la création du remboursement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  /**
   * Test the Stripe connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Try to retrieve account information
      const account = await this.stripe.accounts.retrieve()
      
      return {
        success: true,
        message: `Connexion réussie. Compte: ${account.business_profile?.name || account.id}`
      }
    } catch (error) {
      console.error('Stripe connection test error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur de connexion inconnue'
      }
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(payload: string, signature: string, secret: string): Stripe.Event {
    try {
      return Stripe.webhooks.constructEvent(payload, signature, secret)
    } catch (error) {
      console.error('Stripe webhook signature verification error:', error)
      throw new Error(`Signature webhook invalide: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  /**
   * Format amount for Stripe (convert to cents)
   */
  static formatAmount(amount: number, currency: string): number {
    // Stripe expects amounts in the smallest currency unit (cents for USD/EUR)
    const zeroDecimalCurrencies = ['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF']
    
    if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
      return Math.round(amount)
    }
    
    return Math.round(amount * 100)
  }

  /**
   * Format amount from Stripe (convert from cents)
   */
  static formatAmountFromStripe(amount: number, currency: string): number {
    const zeroDecimalCurrencies = ['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF']
    
    if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
      return amount
    }
    
    return amount / 100
  }

  /**
   * Get publishable key for frontend
   */
  getPublishableKey(): string {
    return this.gateway.configuration?.stripePublishableKey || ''
  }
} 