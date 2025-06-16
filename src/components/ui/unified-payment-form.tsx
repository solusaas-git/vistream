'use client'

import { useState } from 'react'
import { StripePaymentForm } from './stripe-payment-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ExternalLink, CreditCard } from 'lucide-react'

interface UnifiedPaymentFormProps {
  provider: string
  amount: number
  currency: string
  description: string
  customerEmail?: string
  customerName?: string
  metadata?: Record<string, any>
  onSuccess?: (result: any) => void
  onError?: (error: string) => void
}

export function UnifiedPaymentForm({
  provider,
  amount,
  currency,
  description,
  customerEmail,
  customerName,
  metadata,
  onSuccess,
  onError
}: UnifiedPaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const [paymentCreated, setPaymentCreated] = useState(false)

  const handleMolliePayment = async () => {
    if (loading || paymentCreated) {
      return // Prevent duplicate calls
    }
    
    setLoading(true)
    setPaymentCreated(true)
    
    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          description,
          provider: 'mollie',
          customerEmail: customerEmail || 'test@example.com',
          customerName: customerName || 'Client Test',
          redirectUrl: `${window.location.origin}/auth/complete-payment?success=true`,
          // webhookUrl: `https://ecda-196-119-62-0.ngrok-free.app/api/webhooks/mollie`, // Disabled for development
          metadata: {
            ...metadata,
            paymentMethod: 'mollie_redirect'
          }
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Set flag to indicate payment was initiated
        sessionStorage.setItem('payment_initiated', 'true')
        sessionStorage.setItem('payment_provider', 'mollie')
        sessionStorage.setItem('payment_id', data.payment.id)
        // Store the current page URL for retry redirects
        sessionStorage.setItem('payment_origin_url', window.location.href)
        
        // Redirect to Mollie checkout
        window.location.href = data.payment.checkoutUrl
      } else {
        onError?.(data.error || 'Erreur lors de la création du paiement Mollie')
        setPaymentCreated(false) // Reset on error to allow retry
      }
    } catch (err) {
      onError?.('Erreur de connexion')
      console.error('Mollie payment creation error:', err)
      setPaymentCreated(false) // Reset on error to allow retry
    } finally {
      setLoading(false)
    }
  }

  const handleStripeSuccess = (result: any) => {
    console.log('Stripe payment succeeded:', result)
    onSuccess?.(result)
  }

  const handleStripeError = (error: string) => {
    console.error('Stripe payment error:', error)
    onError?.(error)
  }

  // Render Stripe integrated form
  if (provider === 'stripe') {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Paiement par Carte</h3>
          <p className="text-sm text-muted-foreground">
            Paiement sécurisé intégré - Pas de redirection
          </p>
        </div>
        
        <StripePaymentForm
          amount={amount}
          currency={currency}
          description={description}
          customerEmail={customerEmail}
          customerName={customerName}
          metadata={metadata}
          onSuccess={handleStripeSuccess}
          onError={handleStripeError}
        />
      </div>
    )
  }

  // Render Mollie redirect form
  if (provider === 'mollie') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Paiement Mollie
          </CardTitle>
          <CardDescription>
            {description} - {amount}€
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-1">
                  Méthodes de paiement disponibles :
                </p>
                <ul className="text-blue-800 space-y-1">
                  <li>• Cartes bancaires (Visa, Mastercard, etc.)</li>
                  <li>• Bancontact, iDEAL</li>
                  <li>• PayPal, Apple Pay</li>
                  <li>• Virement bancaire</li>
                </ul>
              </div>
            </div>
          </div>

          {customerEmail && (
            <div className="text-sm text-muted-foreground">
              Email: {customerEmail}
            </div>
          )}

          <Button 
            onClick={handleMolliePayment}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirection...
              </>
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Continuer vers Mollie ({amount}€)
              </>
            )}
          </Button>

          <div className="text-xs text-muted-foreground text-center">
            Vous serez redirigé vers la page de paiement sécurisée Mollie
          </div>
        </CardContent>
      </Card>
    )
  }

  // Fallback for unsupported providers
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-6">
        <div className="text-center">
          <p className="text-red-600">
            Provider de paiement non supporté: {provider}
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 