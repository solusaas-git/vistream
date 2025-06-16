'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, CheckCircle, XCircle } from 'lucide-react'

// Initialize Stripe
let stripePromise: Promise<any> | null = null

const getStripe = () => {
  if (!stripePromise) {
    // We'll get the publishable key from the active gateway
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')
  }
  return stripePromise
}

interface PaymentFormProps {
  amount: number
  currency: string
  description: string
  customerEmail?: string
  customerName?: string
  metadata?: Record<string, any>
  onSuccess: (paymentResult: any) => void
  onError: (error: string) => void
}

function PaymentForm({ 
  amount, 
  currency, 
  description, 
  customerEmail, 
  customerName,
  metadata,
  onSuccess, 
  onError 
}: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'succeeded' | 'failed'>('idle')
  const [paymentIntentCreated, setPaymentIntentCreated] = useState(false)
  const creationInProgress = useRef(false)

  // Memoize metadata to prevent unnecessary re-renders
  const memoizedMetadata = useMemo(() => metadata || {}, [metadata])

  // Create Payment Intent when component mounts (only once)
  useEffect(() => {
    if (paymentIntentCreated || clientSecret || creationInProgress.current) {
      return // Prevent duplicate creation
    }

    const createPaymentIntent = async () => {
      try {
        creationInProgress.current = true
        setPaymentIntentCreated(true)
        
        console.log('Creating payment intent...', {
          amount,
          currency,
          description,
          metadata: memoizedMetadata
        })
        
        const response = await fetch('/api/payments/stripe/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount,
            currency,
            description,
            customerEmail,
            customerName,
            metadata: memoizedMetadata
          }),
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.success && data.clientSecret) {
          setClientSecret(data.clientSecret)
          console.log('Payment intent created successfully:', data.paymentIntentId)
          
          // Store the current page URL for retry redirects
          sessionStorage.setItem('payment_initiated', 'true')
          sessionStorage.setItem('payment_provider', 'stripe')
          sessionStorage.setItem('payment_id', data.paymentIntentId)
          sessionStorage.setItem('payment_origin_url', window.location.href)
        } else {
          const errorMessage = data.error || 'Erreur lors de la création du paiement'
          console.error('Payment intent creation failed:', errorMessage)
          onError(errorMessage)
          setPaymentIntentCreated(false) // Reset on error to allow retry
        }
      } catch (error) {
        console.error('Payment intent creation error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion'
        onError(errorMessage)
        setPaymentIntentCreated(false) // Reset on error to allow retry
      } finally {
        creationInProgress.current = false
      }
    }

    createPaymentIntent()
  }, [amount, currency, description, customerEmail, customerName, memoizedMetadata, onError, paymentIntentCreated, clientSecret])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      return
    }

    setLoading(true)
    setPaymentStatus('processing')

    try {
      const cardElement = elements.getElement(CardElement)

      if (!cardElement) {
        onError('Élément de carte non trouvé')
        setLoading(false)
        setPaymentStatus('failed')
        return
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: customerName || '',
            email: customerEmail || '',
          },
        },
      })

      if (error) {
        console.error('Stripe payment error:', error)
        const errorMessage = error.message || 'Erreur lors du paiement'
        onError(errorMessage)
        setPaymentStatus('failed')
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setPaymentStatus('succeeded')
        onSuccess({
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        })
      } else {
        console.error('Unexpected payment intent status:', paymentIntent?.status)
        onError('Statut de paiement inattendu')
        setPaymentStatus('failed')
      }
    } catch (error) {
      console.error('Stripe payment exception:', error)
      onError('Erreur inattendue lors du paiement')
      setPaymentStatus('failed')
    } finally {
      setLoading(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  }

  if (paymentStatus === 'succeeded') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            <h3 className="text-lg font-semibold text-green-800">Paiement Réussi !</h3>
            <p className="text-sm text-muted-foreground">
              Votre paiement de {amount}€ a été traité avec succès.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (paymentStatus === 'failed') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <XCircle className="h-16 w-16 text-red-600 mx-auto" />
            <h3 className="text-lg font-semibold text-red-800">Paiement Échoué</h3>
            <p className="text-sm text-muted-foreground">
              Une erreur s'est produite lors du traitement de votre paiement.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setPaymentStatus('idle')
                setLoading(false)
              }}
            >
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Paiement Sécurisé
        </CardTitle>
        <CardDescription>
          {description} - {amount}€
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Informations de carte</label>
            <div className="p-3 border rounded-md">
              <CardElement options={cardElementOptions} />
            </div>
          </div>

          {customerEmail && (
            <div className="text-sm text-muted-foreground">
              Email: {customerEmail}
            </div>
          )}

          <Button 
            type="submit" 
            disabled={!stripe || loading || !clientSecret}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement...
              </>
            ) : (
              `Payer ${amount}€`
            )}
          </Button>

          <div className="text-xs text-muted-foreground text-center">
            Paiement sécurisé par Stripe. Vos informations sont protégées.
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

interface StripePaymentFormProps extends PaymentFormProps {
  stripePublishableKey?: string
}

export function StripePaymentForm({
  amount,
  currency,
  description,
  customerEmail,
  customerName,
  metadata,
  onSuccess,
  onError
}: StripePaymentFormProps) {
  const [stripe, setStripe] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const paymentMetadata = metadata || {}

  // Memoize options at the top level to maintain hook order
  const elementsOptions: StripeElementsOptions = useMemo(() => ({
    appearance: {
      theme: 'stripe',
    },
  }), [])

  useEffect(() => {
    let isMounted = true

    const initializeStripe = async () => {
      try {
        // Get Stripe publishable key from active gateway
        const response = await fetch('/api/payments/stripe/config')
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (!isMounted) return // Component unmounted
        
        if (data.success && data.publishableKey) {
          const stripeInstance = await loadStripe(data.publishableKey)
          if (isMounted && stripeInstance) {
            setStripe(stripeInstance)
          } else if (isMounted) {
            setError('Impossible de charger Stripe')
          }
        } else {
          if (isMounted) {
            const errorMessage = data.error || 'Configuration Stripe non trouvée'
            console.error('Stripe config error:', errorMessage)
            setError(errorMessage)
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Stripe initialization error:', error)
          const errorMessage = error instanceof Error ? error.message : 'Erreur lors de l\'initialisation de Stripe'
          setError(errorMessage)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initializeStripe()

    return () => {
      isMounted = false
    }
  }, []) // Initialize only once

  if (loading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Initialisation du paiement...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    )
  }

  if (!stripe) {
    return (
      <Alert>
        <AlertDescription>
          Impossible d'initialiser Stripe. Veuillez vérifier la configuration.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Elements stripe={stripe} options={elementsOptions}>
      <PaymentForm {...{ amount, currency, description, customerEmail, customerName, metadata, onSuccess, onError }} />
    </Elements>
  )
} 