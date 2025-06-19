'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CreditCard, CheckCircle, XCircle, ArrowLeft, AlertCircle } from 'lucide-react'
import { UnifiedPaymentForm } from '@/components/ui/unified-payment-form'
import Image from 'next/image'

interface PaymentSession {
  type: 'subscription' | 'renewal' | 'upgrade'
  planId: string
  planName: string
  amount: number
  currency: string
  description: string
  userId: string
  userEmail: string
  userName: string
  metadata?: Record<string, any>
}

interface PaymentGateway {
  id: string
  provider: string
  displayName: string
  description: string
  supportedCurrencies: string[]
  supportedPaymentMethods: string[]
  fees: {
    fixedFee: number
    percentageFee: number
    currency: string
  }
  limits: {
    minAmount: number
    maxAmount: number
    currency: string
  }
  priority: number
  isRecommended: boolean
}

function PaymentPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [paymentSession, setPaymentSession] = useState<PaymentSession | null>(null)
  const [availableGateways, setAvailableGateways] = useState<PaymentGateway[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handlePaymentRedirectSuccess = useCallback(async () => {
    setLoading(true)
    try {
      // Try to get the latest payment for the user
      const latestResponse = await fetch('/api/payments/latest')
      const latestData = await latestResponse.json()
      
      if (latestData.success && latestData.payment) {
        const paymentId = latestData.payment.id || latestData.payment.externalPaymentId || latestData.payment._id
        
        if (paymentId) {
          // Complete the payment
          const response = await fetch('/api/payments/complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentId: paymentId,
              provider: 'mollie' // Most redirects are from Mollie
            }),
          })
          
          const data = await response.json()
          
          if (data.success) {
            setSuccess(true)
            // Clear payment session
            await fetch('/api/payments/session', { method: 'DELETE' })
            
            // Redirect after showing success message
            setTimeout(() => {
              router.push('/admin/subscription')
            }, 3000)
          } else {
            // Check if payment was already processed
            if (data.error && data.error.includes('déjà traité')) {
              setSuccess(true)
              setTimeout(() => router.push('/admin/subscription'), 3000)
            } else {
              throw new Error(data.error || 'Erreur lors de la finalisation du paiement')
            }
          }
        } else {
          throw new Error('ID de paiement non trouvé')
        }
      } else {
        throw new Error('Aucun paiement récent trouvé')
      }
    } catch (error) {
      console.error('Error handling payment redirect:', error)
      setError(error instanceof Error ? error.message : 'Erreur lors du traitement du paiement')
    } finally {
      setLoading(false)
    }
  }, [router])

  const loadPaymentSession = useCallback(async () => {
    try {
      const response = await fetch('/api/payments/session')
      const data = await response.json()

      console.log('Payment session API response:', data)

      if (data.success && data.session) {
        console.log('Payment session found:', data.session)
        setPaymentSession(data.session)
      } else {
        console.log('No payment session found, checking for pending subscription')
        // No valid payment session, check if user has pending subscription
        await createSessionFromPendingSubscription()
      }
    } catch (error) {
      console.error('Error loading payment session:', error)
      setError('Erreur lors du chargement de la session de paiement')
      // If there's an error and no payment session, redirect to subscription page
      setTimeout(() => router.push('/admin/subscription'), 2000)
    }
  }, [router])

  // Load payment session on mount
  useEffect(() => {
    // Check if this is a redirect from a payment provider
    const isSuccess = searchParams.get('success') === 'true'
    const isCancelled = searchParams.get('cancelled') === 'true'
    
    if (isSuccess) {
      // Handle successful payment redirect
      handlePaymentRedirectSuccess()
    } else if (isCancelled) {
      // Handle cancelled payment
      setError('Paiement annulé par l\'utilisateur')
      setTimeout(() => router.push('/admin/subscription'), 3000)
    } else {
      // Normal flow - load payment session
      loadPaymentSession()
      loadPaymentGateways()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const createSessionFromPendingSubscription = async () => {
    try {
      // Check user's subscription status
      const subResponse = await fetch('/api/auth/subscription-status')
      const subData = await subResponse.json()

      if (subData.authenticated && subData.subscription && subData.subscription.status === 'pending') {
        // Get plan details
        const planResponse = await fetch('/api/plans')
        const planData = await planResponse.json()
        
        // API returns data in data.plans structure
        const plans = planData.data?.plans || planData.plans || []
        
        console.log('Looking for plan:', subData.subscription.planId)
        console.log('Available plans:', plans?.map((p: any) => ({ id: p._id, name: p.name })))
        
        const plan = plans?.find((p: any) => 
          p._id === subData.subscription.planId || 
          p._id.toString() === subData.subscription.planId ||
          p._id === subData.subscription.planId.toString()
        )
        
        console.log('Found plan:', plan ? { id: plan._id, name: plan.name } : null)
        
        if (plan) {
          // Create payment session for pending subscription
          console.log('Creating payment session with:', {
            type: 'subscription',
            planId: plan._id,
            planName: plan.name,
            amount: parseFloat(plan.price.replace('€', '')),
            currency: 'EUR',
            description: `Abonnement ${plan.name}`,
            userEmail: subData.user.email,
            userName: `${subData.user.firstName} ${subData.user.lastName}`,
          })

          const sessionResponse = await fetch('/api/payments/session', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'subscription',
              planId: plan._id,
              planName: plan.name,
              amount: parseFloat(plan.price.replace('€', '')),
              currency: 'EUR',
              description: `Abonnement ${plan.name}`,
              userEmail: subData.user.email,
              userName: `${subData.user.firstName} ${subData.user.lastName}`,
            }),
          })

          const sessionData = await sessionResponse.json()
          
          console.log('Session response:', {
            status: sessionResponse.status,
            data: sessionData
          })
          
          if (sessionData.success) {
            setPaymentSession(sessionData.session)
          } else {
            throw new Error(`Impossible de créer la session de paiement: ${sessionData.error || 'Erreur inconnue'}`)
          }
        } else {
          throw new Error('Plan non trouvé')
        }
      } else {
        // No pending subscription found
        console.log('No pending subscription found')
        
        // If user has an active subscription, check for recent completed payments
        if (subData.authenticated && subData.subscription && subData.subscription.status === 'active') {
          console.log('User has active subscription but no payment session - checking for recent payments')
          
          // Check if there's a recent completed payment (upgrade/renewal that might have been processed)
          try {
            const latestPaymentResponse = await fetch('/api/payments/latest')
            const latestPaymentData = await latestPaymentResponse.json()
            
            if (latestPaymentData.success && latestPaymentData.payment) {
              const payment = latestPaymentData.payment
              const paymentDate = new Date(payment.createdAt)
              const now = new Date()
              const timeDiff = now.getTime() - paymentDate.getTime()
              const minutesDiff = timeDiff / (1000 * 60)
              
              // If there's a completed payment from the last 10 minutes
              if (payment.status === 'completed' && minutesDiff < 10) {
                console.log('Found recent completed payment, showing success message')
                setSuccess(true)
                setTimeout(() => router.push('/admin/subscription'), 3000)
                return
              }
            }
          } catch (error) {
            console.error('Error checking latest payment:', error)
          }
          
          setError('Session de paiement expirée. Veuillez recommencer le processus.')
          setTimeout(() => router.push('/admin/subscription'), 3000)
        } else {
          // No subscription at all, redirect to subscription page
          console.log('No subscription found, redirecting to subscription page')
          router.push('/admin/subscription')
        }
      }
    } catch (error) {
      console.error('Error creating session from pending subscription:', error)
      setError('Erreur lors de la création de la session de paiement')
      // Fallback: redirect to subscription page
      setTimeout(() => router.push('/admin/subscription'), 2000)
    }
  }

  const loadPaymentGateways = useCallback(async () => {
    try {
      const response = await fetch('/api/payments/gateways')
      const data = await response.json()
      
      if (data.success) {
        setAvailableGateways(data.gateways)
      } else {
        setError('Erreur lors du chargement des méthodes de paiement')
      }
    } catch (error) {
      console.error('Error fetching gateways:', error)
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }, [])

  const handlePaymentSuccess = async (paymentResult: any) => {
    console.log('Payment successful:', paymentResult)
    setProcessing(true)

    try {
      // For Stripe, get payment intent ID; for Mollie, get payment ID
      const paymentId = paymentResult.paymentId || paymentResult.paymentIntentId || paymentResult.id

      if (!paymentId) {
        throw new Error('Payment ID not found in result')
      }

      // Complete the payment process - use unified API for all types
      const response = await fetch('/api/payments/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          paymentId,
          sessionType: paymentSession?.type 
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        // Clear payment session
        await fetch('/api/payments/session', { method: 'DELETE' })
        
        // Redirect after showing success message
        setTimeout(() => {
          router.push('/admin/subscription')
        }, 3000)
      } else {
        throw new Error(data.error || 'Erreur lors de la finalisation du paiement')
      }
    } catch (error) {
      console.error('Payment completion error:', error)
      setError(error instanceof Error ? error.message : 'Erreur lors du traitement du paiement')
      setProcessing(false)
    }
  }

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error)
    setError(error)
  }

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'mollie':
        return <CreditCard className="h-6 w-6 text-blue-600" />
      case 'stripe':
        return <CreditCard className="h-6 w-6 text-purple-600" />
      case 'paypal':
        return <CreditCard className="h-6 w-6 text-blue-500" />
      default:
        return <CreditCard className="h-6 w-6 text-gray-600" />
    }
  }

  const getProviderBadge = (gateway: PaymentGateway) => {
    if (gateway.isRecommended) {
      return { text: 'Recommandé', className: 'bg-green-100 text-green-700' }
    }
    return { text: 'Autres options', className: 'bg-blue-100 text-blue-700' }
  }

  const getProviderDetails = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'stripe':
        return {
          subtitle: 'Paiement intégré et sécurisé - Pas de redirection',
          methods: 'Visa, Mastercard, etc.',
          timing: 'Immédiat'
        }
      case 'mollie':
        return {
          subtitle: 'Bancontact, iDEAL, PayPal, Virement',
          methods: 'Méthodes européennes',
          timing: 'Redirection'
        }
      case 'paypal':
        return {
          subtitle: 'Paiement via votre compte PayPal',
          methods: 'PayPal, cartes',
          timing: 'Redirection'
        }
      default:
        return {
          subtitle: 'Méthode de paiement sécurisée',
          methods: 'Divers',
          timing: 'Variable'
        }
    }
  }

  const getPaymentTypeTitle = () => {
    switch (paymentSession?.type) {
      case 'subscription':
        return 'Finaliser votre abonnement'
      case 'renewal':
        return 'Renouveler votre abonnement'
      case 'upgrade':
        return 'Mettre à niveau votre abonnement'
      default:
        return 'Paiement'
    }
  }

  const getPaymentTypeDescription = () => {
    switch (paymentSession?.type) {
      case 'subscription':
        return 'Complétez votre inscription pour accéder à toutes les fonctionnalités'
      case 'renewal':
        return 'Prolongez votre accès sans interruption de service'
      case 'upgrade':
        return 'Accédez à plus de fonctionnalités avec votre nouveau plan'
      default:
        return 'Choisissez votre méthode de paiement préférée'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <h2 className="text-xl font-semibold">Chargement</h2>
              <p className="text-muted-foreground">Préparation du paiement...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
              <h2 className="text-2xl font-bold text-green-800">Paiement réussi !</h2>
              <p className="text-green-600">
                {paymentSession?.type === 'subscription' && 'Votre abonnement est maintenant actif.'}
                {paymentSession?.type === 'renewal' && 'Votre abonnement a été renouvelé avec succès.'}
                {paymentSession?.type === 'upgrade' && 'Votre abonnement a été mis à niveau.'}
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-700">
                  Redirection automatique vers votre espace client...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !paymentSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 mx-auto text-red-500" />
              <h2 className="text-xl font-semibold text-red-800">Erreur</h2>
              <p className="text-red-600">{error || 'Session de paiement non trouvée'}</p>
              <div className="space-y-2">
                <Button 
                  onClick={() => {
                    setError(null)
                    loadPaymentSession()
                    loadPaymentGateways()
                  }}
                  className="w-full"
                >
                  Réessayer
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/admin/subscription')}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à l'abonnement
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-start justify-center pt-8 sm:pt-12 pb-4 sm:pb-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-gray-800 rounded-full shadow-md border border-gray-700">
              <Image
                src="/logo.svg"
                alt="Vistream Logo"
                width={48}
                height={48}
                className="w-10 h-10 sm:w-12 sm:h-12"
              />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{getPaymentTypeTitle()}</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            {getPaymentTypeDescription()}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Plan Summary */}
          <div className="lg:order-2">
            <Card className="shadow-lg border-0 sticky top-8">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl mb-2 flex items-center justify-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {paymentSession.planName}
                </CardTitle>
                <div className="mb-4">
                  <div className="flex items-baseline justify-center space-x-1">
                    <span className="text-3xl font-bold text-primary">
                      {paymentSession.amount}€
                    </span>
                    <span className="text-sm text-muted-foreground">
                      /{paymentSession.currency}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{paymentSession.description}</p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>
                      {paymentSession.type === 'subscription' && 'Compte créé avec succès'}
                      {paymentSession.type === 'renewal' && 'Renouvellement d\'abonnement'}
                      {paymentSession.type === 'upgrade' && 'Mise à niveau d\'abonnement'}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CreditCard className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                    <span>Paiement sécurisé</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span>Activation immédiate</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-2 lg:order-1">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Paiement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {processing ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Traitement du paiement...</p>
                  </div>
                ) : selectedProvider ? (
                  <div className="space-y-4">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedProvider(null)}
                      className="mb-4"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Changer de méthode
                    </Button>
                    
                    <UnifiedPaymentForm
                      provider={selectedProvider}
                      amount={paymentSession.amount}
                      currency={paymentSession.currency}
                      description={paymentSession.description}
                      customerEmail={paymentSession.userEmail}
                      customerName={paymentSession.userName}
                      metadata={paymentSession.metadata}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableGateways.length === 0 ? (
                      <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 mx-auto text-orange-500 mb-4" />
                        <h3 className="text-lg font-medium mb-2">Aucune méthode disponible</h3>
                        <p className="text-muted-foreground">
                          Veuillez contacter le support pour finaliser votre paiement.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="text-center mb-6">
                          <h3 className="text-lg font-semibold mb-2">Choisissez votre méthode de paiement</h3>
                          <p className="text-sm text-muted-foreground">
                            Sélectionnez la méthode qui vous convient le mieux
                          </p>
                        </div>

                        <div className="grid gap-4">
                          {availableGateways.map((gateway) => {
                            const badge = getProviderBadge(gateway)
                            const details = getProviderDetails(gateway.provider)
                            
                            return (
                              <Card 
                                key={gateway.id}
                                className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50"
                                onClick={() => setSelectedProvider(gateway.provider)}
                              >
                                <CardContent className="p-6">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      <div className="p-3 bg-gray-100 rounded-full">
                                        {getProviderIcon(gateway.provider)}
                                      </div>
                                      <div>
                                        <h4 className="font-semibold">{gateway.displayName}</h4>
                                        <p className="text-sm text-muted-foreground">
                                          {gateway.description || details.subtitle}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className={`text-xs px-2 py-1 rounded ${badge.className}`}>
                                            {badge.text}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            {details.methods}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-lg font-bold">{paymentSession.amount}€</div>
                                      <div className="text-xs text-muted-foreground">{details.timing}</div>
                                      {gateway.fees.percentageFee > 0 && (
                                        <div className="text-xs text-muted-foreground">
                                          +{gateway.fees.percentageFee}% frais
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>

                        <div className="text-xs text-muted-foreground text-center mt-4">
                          Tous les paiements sont sécurisés et cryptés
                        </div>

                        {/* Security and Payment Cards Section */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                          <div className="text-center space-y-4">
                            {/* Security Badges */}
                            <div className="flex flex-col items-center space-y-3">
                              <h4 className="text-sm font-medium text-gray-700">Paiement 100% sécurisé</h4>
                              <div className="flex items-center justify-center space-x-4">
                                <Image
                                  src="/logos/security/sectigo-ssl.avif"
                                  alt="SSL Secure"
                                  width={82}
                                  height={32}
                                  className="h-8 w-auto"
                                />
                                <Image
                                  src="/logos/security/ssl-secure-badge.avif"
                                  alt="SSL Certificate"
                                  width={167}
                                  height={42}
                                  className="h-8 w-auto"
                                />
                                <Image
                                  src="/logos/security/sectigo-secure.avif"
                                  alt="Trusted Security"
                                  width={106}
                                  height={42}
                                  className="h-8 w-auto"
                                />
                              </div>
                            </div>

                            {/* Payment Cards */}
                            <div className="flex flex-col items-center space-y-3">
                              <h4 className="text-sm font-medium text-gray-700">Cartes acceptées</h4>
                              <div className="flex items-center justify-center space-x-3">
                                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                                  <Image
                                    src="/logos/payment/visa.svg"
                                    alt="Visa"
                                    width={80}
                                    height={28}
                                    className="h-7 w-auto"
                                  />
                                </div>
                                
                                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                                  <Image
                                    src="/logos/payment/mastercard.svg"
                                    alt="Mastercard"
                                    width={80}
                                    height={28}
                                    className="h-7 w-auto"
                                  />
                                </div>
                                
                                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                                  <Image
                                    src="/logos/payment/amex.svg"
                                    alt="American Express"
                                    width={80}
                                    height={28}
                                    className="h-7 w-auto"
                                  />
                                </div>
                                
                                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                                  <Image
                                    src="/logos/payment/paypal.svg"
                                    alt="PayPal"
                                    width={80}
                                    height={28}
                                    className="h-7 w-auto"
                                  />
                                </div>
                                
                                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                                  <Image
                                    src="/logos/payment/apple-pay.svg"
                                    alt="Apple Pay"
                                    width={80}
                                    height={28}
                                    className="h-7 w-auto"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Chargement du paiement...</p>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentPageContent />
    </Suspense>
  )
} 