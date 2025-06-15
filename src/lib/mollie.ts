import connectToDatabase from '@/lib/mongoose'
import PaymentGateway from '@/models/PaymentGateway'

export interface MolliePaymentData {
  amount: {
    currency: string
    value: string
  }
  description: string
  redirectUrl: string
  webhookUrl?: string
  metadata?: Record<string, any>
  method?: string[]
  locale?: string
}

export interface MolliePaymentResponse {
  id: string
  status: string
  amount: {
    currency: string
    value: string
  }
  description: string
  metadata: Record<string, any>
  createdAt: string
  expiresAt?: string
  profileId: string
  sequenceType: string
  redirectUrl: string
  webhookUrl?: string
  _links: {
    self: { href: string }
    checkout: { href: string }
    dashboard?: { href: string }
  }
}

export class MollieService {
  private apiKey: string
  private isTestMode: boolean
  private baseUrl: string

  constructor(apiKey: string, isTestMode: boolean = true) {
    this.apiKey = apiKey
    this.isTestMode = isTestMode
    this.baseUrl = 'https://api.mollie.com/v2'
  }

  /**
   * Get the active Mollie gateway configuration
   */
  static async getActiveGateway(): Promise<any> {
    await connectToDatabase()
    
    const gateway = await PaymentGateway.findOne({ 
      provider: 'mollie', 
      isActive: true 
    }).select('+configuration.mollieApiKey +configuration.webhookSecret')

    if (!gateway) {
      throw new Error('No active Mollie gateway found')
    }

    if (!gateway.configuration?.mollieApiKey) {
      throw new Error('Mollie API key not configured')
    }

    return gateway
  }

  /**
   * Create a new Mollie service instance from the active gateway
   */
  static async fromActiveGateway(): Promise<MollieService> {
    const gateway = await this.getActiveGateway()
    
    return new MollieService(
      gateway.configuration.mollieApiKey,
      gateway.configuration.mollieTestMode ?? true
    )
  }

  /**
   * Create a payment with Mollie
   */
  async createPayment(paymentData: MolliePaymentData): Promise<MolliePaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Mollie API error: ${errorData.detail || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating Mollie payment:', error)
      throw error
    }
  }

  /**
   * Get payment details from Mollie
   */
  async getPayment(paymentId: string): Promise<MolliePaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Mollie API error: ${errorData.detail || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching Mollie payment:', error)
      throw error
    }
  }

  /**
   * Get available payment methods
   */
  async getPaymentMethods(params?: { locale?: string; amount?: { currency: string; value: string } }): Promise<any> {
    try {
      const searchParams = new URLSearchParams()
      if (params?.locale) searchParams.append('locale', params.locale)
      if (params?.amount) {
        searchParams.append('amount[currency]', params.amount.currency)
        searchParams.append('amount[value]', params.amount.value)
      }

      const url = `${this.baseUrl}/methods${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Mollie API error: ${errorData.detail || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching Mollie payment methods:', error)
      throw error
    }
  }

  /**
   * Cancel a payment
   */
  async cancelPayment(paymentId: string): Promise<MolliePaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Mollie API error: ${errorData.detail || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error canceling Mollie payment:', error)
      throw error
    }
  }

  /**
   * Create a refund for a payment
   */
  async createRefund(paymentId: string, refundData: { amount?: { currency: string; value: string }; description?: string }): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentId}/refunds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refundData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Mollie API error: ${errorData.detail || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating Mollie refund:', error)
      throw error
    }
  }

  /**
   * Test the connection to Mollie API
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const methods = await this.getPaymentMethods()
      return {
        success: true,
        message: `Connexion réussie. ${methods.count || 0} méthodes de paiement disponibles.`
      }
    } catch (error) {
      return {
        success: false,
        message: `Erreur de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      }
    }
  }

  /**
   * Format amount for Mollie (must be string with 2 decimal places)
   */
  static formatAmount(amount: number, currency: string = 'EUR'): { currency: string; value: string } {
    return {
      currency: currency.toUpperCase(),
      value: amount.toFixed(2)
    }
  }

  /**
   * Parse amount from Mollie format to number
   */
  static parseAmount(mollieAmount: { currency: string; value: string }): number {
    return parseFloat(mollieAmount.value)
  }
} 