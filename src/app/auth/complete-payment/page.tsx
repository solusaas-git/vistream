'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, AlertCircle, CheckCircle, ArrowLeft, Eye, EyeOff, UserPlus, Mail, Lock, User, Phone, ChevronDown, Star, Check, Crown, Shield, Hash, XCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { UnifiedPaymentForm } from '@/components/ui/unified-payment-form'

// Payment Gateway Interface
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

// Payment Method Selector Component
interface PaymentMethodSelectorProps {
  amount: number
  currency: string
  description: string
  customerEmail?: string
  customerName?: string
  metadata?: Record<string, any>
  onSuccess: (result: any) => void
  onError: (error: string) => void
}

function PaymentMethodSelector({
  amount,
  currency,
  description,
  customerEmail,
  customerName,
  metadata,
  onSuccess,
  onError
}: PaymentMethodSelectorProps) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [availableGateways, setAvailableGateways] = useState<PaymentGateway[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGateways = async () => {
      try {
        const response = await fetch('/api/payments/gateways')
        const data = await response.json()
        
        if (data.success) {
          setAvailableGateways(data.gateways)
        } else {
          setError('Erreur lors du chargement des méthodes de paiement')
        }
      } catch (err) {
        setError('Erreur de connexion')
        console.error('Error fetching gateways:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchGateways()
  }, [])

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

  if (selectedProvider) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => setSelectedProvider(null)}
          className="mb-4"
        >
          ← Changer de méthode
        </Button>
        
        <UnifiedPaymentForm
          provider={selectedProvider}
          amount={amount}
          currency={currency}
          description={description}
          customerEmail={customerEmail}
          customerName={customerName}
          metadata={metadata}
          onSuccess={onSuccess}
          onError={onError}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">Choisissez votre méthode de paiement</h3>
          <p className="text-sm text-muted-foreground">
            Chargement des méthodes disponibles...
          </p>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Chargement...</span>
        </div>
      </div>
    )
  }

  if (error || availableGateways.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">Méthodes de paiement</h3>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            {error || 'Aucune méthode de paiement disponible pour le moment.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Choisissez votre méthode de paiement</h3>
        <p className="text-sm text-muted-foreground">
          Finalisez votre abonnement pour accéder à votre espace client
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
                    <div className="text-lg font-bold">{amount}€</div>
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
    </div>
  )
}

function CompletePaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentCancelled, setPaymentCancelled] = useState(false)
  const [paymentFailed, setPaymentFailed] = useState(false)
  const [paymentErrorPersistent, setPaymentErrorPersistent] = useState(false)
  const [errorDisplayStartTime, setErrorDisplayStartTime] = useState<number | null>(null)
  const [authRetryCount, setAuthRetryCount] = useState(0)
  const [redirectCountdown, setRedirectCountdown] = useState(0)

  const verifyPaymentStatus = useCallback(async () => {
    try {
      console.log('🔍 Verifying payment status with backend...')
      setLoading(true)
      
      // Check latest payment status from our enhanced API
      const response = await fetch('/api/payments/latest')
      const data = await response.json()
      
      if (data.success && data.payment) {
        console.log('💳 Latest payment data:', {
          id: data.payment.id,
          status: data.payment.status,
          normalizedStatus: data.payment.normalizedStatus,
          provider: data.payment.provider,
          isProcessed: data.payment.isProcessed,
          webhookProcessedAt: data.payment.webhookProcessedAt
        })
        
        // Check if payment is completed (either 'paid' from Mollie or 'completed' normalized)
        const isPaymentSuccessful = data.payment.status === 'paid' || 
                                   data.payment.normalizedStatus === 'completed' ||
                                   data.payment.isProcessed === true

        // Check if payment failed
        const isPaymentFailed = data.payment.status === 'failed' || 
                               data.payment.normalizedStatus === 'failed'

        // Check if payment was cancelled
        const isPaymentCancelled = data.payment.status === 'canceled' || 
                                  data.payment.status === 'cancelled' ||
                                  data.payment.normalizedStatus === 'cancelled'

        // Check if payment expired
        const isPaymentExpired = data.payment.status === 'expired' || 
                                data.payment.normalizedStatus === 'expired'
        
        if (isPaymentSuccessful) {
          console.log('✅ Payment verified as successful by backend')
          
          // Check if this is a subscription upgrade or renewal payment
          if (data.payment.metadata?.type === 'subscription_upgrade' || data.payment.metadata?.type === 'subscription_renewal') {
            const isRenewal = data.payment.metadata?.type === 'subscription_renewal'
            console.log(`🔄 Processing subscription ${isRenewal ? 'renewal' : 'upgrade'} manually...`)
            try {
              const upgradeResponse = await fetch('/api/subscriptions/upgrade/complete', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  paymentId: data.payment.id
                }),
              })
              
              const upgradeData = await upgradeResponse.json()
              if (upgradeData.success) {
                console.log(`✅ Subscription ${isRenewal ? 'renewal' : 'upgrade'} completed successfully`)
              } else {
                console.error(`❌ Subscription ${isRenewal ? 'renewal' : 'upgrade'} failed:`, upgradeData.error)
              }
            } catch (upgradeError) {
              console.error(`💥 Error processing subscription ${isRenewal ? 'renewal' : 'upgrade'}:`, upgradeError)
            }
          }
          
          setPaymentSuccess(true)
          setLoading(false)
          
          // Clear all payment session storage on success
          sessionStorage.removeItem('payment_initiated')
          sessionStorage.removeItem('payment_provider')
          sessionStorage.removeItem('payment_id')
          sessionStorage.removeItem('payment_origin_url')
          
          // Remove URL parameters
          const newUrl = window.location.pathname
          window.history.replaceState({}, '', newUrl)
          
          // Start countdown for redirect
          console.log('⏱️ Starting 5-second countdown for redirect...')
          setRedirectCountdown(5)
          const countdownInterval = setInterval(() => {
            setRedirectCountdown(prev => {
              if (prev <= 1) {
                clearInterval(countdownInterval)
                console.log('🚀 Countdown finished, redirecting to admin/subscription...')
                setIsRedirecting(true)
                window.location.href = '/admin/subscription'
                return 0
              }
              return prev - 1
            })
          }, 1000)
          
          return
        } else if (isPaymentFailed) {
          console.log('❌ Payment failed')
          setPaymentFailed(true)
          setPaymentErrorPersistent(true)
          setErrorDisplayStartTime(Date.now())
          setLoading(false)
          
          // Clear session storage (but keep origin URL for retry)
          sessionStorage.removeItem('payment_initiated')
          sessionStorage.removeItem('payment_provider')
          sessionStorage.removeItem('payment_id')
          // Keep payment_origin_url for retry functionality
          
          // Remove URL parameters
          const newUrl = window.location.pathname
          window.history.replaceState({}, '', newUrl)
          return
        } else if (isPaymentCancelled) {
          console.log('🚫 Payment cancelled')
          setPaymentCancelled(true)
          setPaymentErrorPersistent(true)
          setErrorDisplayStartTime(Date.now())
          setLoading(false)
          
          // Clear session storage (but keep origin URL for retry)
          sessionStorage.removeItem('payment_initiated')
          sessionStorage.removeItem('payment_provider')
          sessionStorage.removeItem('payment_id')
          // Keep payment_origin_url for retry functionality
          
          // Remove URL parameters
          const newUrl = window.location.pathname
          window.history.replaceState({}, '', newUrl)
          return
        } else if (isPaymentExpired) {
          console.log('⏰ Payment expired')
          setPaymentFailed(true)
          setPaymentErrorPersistent(true)
          setErrorDisplayStartTime(Date.now())
          setLoading(false)
          
          // Clear session storage (but keep origin URL for retry)
          sessionStorage.removeItem('payment_initiated')
          sessionStorage.removeItem('payment_provider')
          sessionStorage.removeItem('payment_id')
          // Keep payment_origin_url for retry functionality
          
          // Remove URL parameters
          const newUrl = window.location.pathname
          window.history.replaceState({}, '', newUrl)
          return
        } else {
          // Payment is still pending, continue waiting
          console.log(`⏳ Payment status: ${data.payment.status}, waiting for completion...`)
          
          // If we've been waiting too long, show an error
          if (authRetryCount >= 10) {
            console.log('⚠️ Payment verification timeout after 10 attempts')
            setError('Le paiement prend plus de temps que prévu. Veuillez vérifier votre compte ou contacter le support.')
            setLoading(false)
            return
          }
          
          // Retry after a delay
          setTimeout(() => {
            setAuthRetryCount(prev => prev + 1)
            verifyPaymentStatus()
          }, 3000)
          return
        }
      } else {
        console.log('❌ No payment data found')
        setError('Aucun paiement trouvé')
        setLoading(false)
      }
    } catch (error) {
      console.error('💥 Error verifying payment status:', error)
      
      if (authRetryCount < 5) {
        console.log(`🔄 Retrying payment verification (attempt ${authRetryCount + 1}/5)...`)
        setTimeout(() => {
          setAuthRetryCount(prev => prev + 1)
          verifyPaymentStatus()
        }, 2000)
      } else {
        setError('Erreur lors de la vérification du paiement')
        setLoading(false)
      }
    }
  }, [authRetryCount])

  const fetchUserData = useCallback(async () => {
    try {
      console.log('👤 Fetching user data...')
      const response = await fetch('/api/auth/me')
      
      if (response.ok) {
        const userData = await response.json()
        console.log('✅ User data loaded:', userData.user?.email)
        setUser(userData.user)
        
        if (userData.user?.subscription) {
          setSubscription(userData.user.subscription)
          console.log('📋 User subscription:', userData.user.subscription.status)
        }
        
        setLoading(false)
      } else if (response.status === 401) {
        console.log('🔐 User not authenticated, redirecting to login...')
        setError('Vous devez être connecté pour accéder à cette page')
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      } else {
        console.log('❌ Failed to fetch user data')
        setError('Erreur lors du chargement des données utilisateur')
        setLoading(false)
      }
    } catch (error) {
      console.error('💥 Error fetching user data:', error)
      setError('Erreur de connexion')
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    // Check if user returned from payment provider
    const success = searchParams.get('success')
    const cancelled = searchParams.get('cancelled')
    const failed = searchParams.get('failed')
    
    if (success === 'true') {
      console.log('Potential payment success detected from URL, verifying with backend...')
      // Don't trust URL parameter, verify with backend
      verifyPaymentStatus()
      return
    } else if (cancelled === 'true') {
      console.log('Payment cancelled by user')
      setPaymentCancelled(true)
      setPaymentErrorPersistent(true)
      setErrorDisplayStartTime(Date.now())
      setLoading(false)
      // Remove the cancelled parameter from URL
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
      return
    } else if (failed === 'true') {
      console.log('Payment failed')
      setPaymentFailed(true)
      setPaymentErrorPersistent(true)
      setErrorDisplayStartTime(Date.now())
      setLoading(false)
      // Remove the failed parameter from URL
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
      return
    }
    
    // Check if user might be returning from payment (no specific URL params)
    // This handles cases where Mollie redirects back without success/failed params
    const hasReturnedFromPayment = document.referrer.includes('mollie.com') || 
                                  document.referrer.includes('checkout.stripe.com') ||
                                  sessionStorage.getItem('payment_initiated') === 'true'
    
    if (hasReturnedFromPayment && !isRedirecting) {
      console.log('User returned from payment provider, checking status...')
      // Add a small delay to allow webhooks to process
      setTimeout(() => {
        verifyPaymentStatus()
      }, 2000)
      return
    }
    
    if (!isRedirecting) {
      fetchUserData()
    }
  }, [isRedirecting, searchParams, router, verifyPaymentStatus, fetchUserData])

  const handlePaymentSuccess = (paymentResult: any) => {
    console.log('Payment successful:', paymentResult)
    
    // Show success message and redirect
    setIsRedirecting(true)
    setTimeout(() => {
      router.replace('/admin/subscription')
    }, 2000)
  }

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error)
    setPaymentError(error)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">
                {paymentSuccess ? 'Vérification de votre paiement...' : 'Chargement...'}
              </p>
              {authRetryCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  Tentative {authRetryCount}/2
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              {paymentSuccess ? (
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              ) : (
                <AlertCircle className="h-16 w-16 text-red-600 mx-auto" />
              )}
              <h3 className={`text-lg font-semibold ${paymentSuccess ? 'text-green-800' : 'text-red-800'}`}>
                {paymentSuccess ? 'Paiement Réussi' : 'Erreur'}
              </h3>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button 
                variant={paymentSuccess ? "default" : "outline"}
                onClick={() => {
                  // Clear auth cookie and redirect to login
                  setIsRedirecting(true)
                  document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;'
                  window.location.replace('/auth/login')
                }}
              >
                {paymentSuccess ? 'Se connecter pour continuer' : 'Retour à la connexion'}
              </Button>
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
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            Finaliser votre abonnement
          </h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Bonjour {user?.firstName}, complétez votre paiement pour accéder à votre espace client
          </p>
        </div>

        {/* Success Alert */}
        {paymentSuccess && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="flex items-center justify-between">
                <div>
                  Paiement effectué avec succès ! Votre abonnement est en cours d'activation. 
                  {redirectCountdown > 0 ? (
                    <>Redirection vers votre espace client dans <strong>{redirectCountdown}</strong> seconde{redirectCountdown > 1 ? 's' : ''}...</>
                  ) : (
                    <>Vous allez être redirigé vers votre espace client dans quelques instants.</>
                  )}
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="ml-4 bg-white hover:bg-gray-50"
                  onClick={() => {
                    console.log('Manual redirect button clicked')
                    setIsRedirecting(true)
                    // Use window.location to bypass middleware
                    window.location.href = '/admin/subscription'
                  }}
                >
                  Accéder maintenant
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Cancelled Alert */}
        {paymentCancelled && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.
            </AlertDescription>
          </Alert>
        )}

        {/* Failed Alert */}
        {paymentFailed && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Paiement échoué. Veuillez réessayer plus tard.
            </AlertDescription>
          </Alert>
        )}

        {/* Alert */}
        {!paymentSuccess && !paymentCancelled && !paymentFailed && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Votre compte a été créé avec succès, mais votre abonnement est en attente de paiement. 
              Veuillez finaliser votre paiement pour accéder à tous les services.
            </AlertDescription>
          </Alert>
        )}

        {/* Payment Cancelled UI */}
        {paymentCancelled && (
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-lg border-0">
              <CardContent className="pt-6">
                <div className="text-center space-y-6">
                  <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Paiement annulé
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Vous avez annulé le processus de paiement. Aucun montant n'a été débité de votre compte.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      onClick={() => {
                        setPaymentCancelled(false)
                        setPaymentErrorPersistent(false)
                        setErrorDisplayStartTime(null)
                        
                        // Get the original page URL and redirect back
                        const originUrl = sessionStorage.getItem('payment_origin_url')
                        if (originUrl) {
                          console.log('Redirecting back to origin URL:', originUrl)
                          window.location.href = originUrl
                        } else {
                          // Fallback to fetching user data if no origin URL
                          fetchUserData()
                        }
                      }}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Réessayer le paiement
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => router.push('/#pricing')}
                    >
                      Voir les plans
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Payment Failed UI */}
        {paymentFailed && (
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-lg border-0">
              <CardContent className="pt-6">
                <div className="text-center space-y-6">
                  <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Paiement échoué
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Le paiement n'a pas pu être traité. Cela peut être dû à des fonds insuffisants, 
                      une carte expirée, ou un problème temporaire avec votre banque.
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-left">
                    <h4 className="font-medium text-gray-900 mb-2">Que faire maintenant ?</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Vérifiez les informations de votre carte</li>
                      <li>• Assurez-vous d'avoir des fonds suffisants</li>
                      <li>• Contactez votre banque si le problème persiste</li>
                      <li>• Essayez avec une autre carte de paiement</li>
                    </ul>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      onClick={() => {
                        setPaymentFailed(false)
                        setPaymentErrorPersistent(false)
                        setErrorDisplayStartTime(null)
                        
                        // Get the original page URL and redirect back
                        const originUrl = sessionStorage.getItem('payment_origin_url')
                        if (originUrl) {
                          console.log('Redirecting back to origin URL:', originUrl)
                          window.location.href = originUrl
                        } else {
                          // Fallback to fetching user data if no origin URL
                          fetchUserData()
                        }
                      }}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Réessayer le paiement
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => window.location.href = '/contact'}
                    >
                      Contacter le support
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Normal Payment Flow */}
        {!paymentCancelled && !paymentFailed && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Plan Summary */}
            {subscription && (
              <div className="lg:order-2">
                <Card className="shadow-lg border-0 sticky top-8">
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-xl mb-2">
                      {subscription.planName}
                    </CardTitle>
                    <div className="mb-4">
                      <div className="flex items-baseline justify-center space-x-1">
                        <span className="text-3xl font-bold text-primary">
                          {subscription.planPrice}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          /{subscription.planPeriod}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>Compte créé avec succès</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <AlertCircle className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                        <span>Paiement en attente</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <CreditCard className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                        <span>Activation après paiement</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

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
                  {paymentError && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{paymentError}</p>
                    </div>
                  )}
                  
                  {subscription && !paymentSuccess && (
                    <PaymentMethodSelector
                      amount={parseFloat(subscription.planPrice)}
                      currency="EUR"
                      description={`${subscription.planName} - ${subscription.planPeriod}`}
                      customerEmail={user?.email}
                      customerName={`${user?.firstName} ${user?.lastName}`}
                      metadata={{
                        userId: user?._id,
                        subscriptionId: subscription._id,
                        planName: subscription.planName,
                        source: 'complete_payment'
                      }}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                    />
                  )}
                  
                  {paymentSuccess && (
                    <div className="text-center py-8">
                      <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-green-800 mb-2">
                        Paiement traité avec succès
                      </h3>
                      <p className="text-gray-600">
                        Votre abonnement a été activé. Vous allez être redirigé automatiquement.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Payment Cards Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center space-y-4">

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
                
                <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                  <Image
                    src="/logos/payment/google-pay.svg"
                    alt="Google Pay"
                    width={80}
                    height={28}
                    className="h-7 w-auto"
                  />
                </div>
              </div>
            </div>

            {/* Trust Message */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-3 max-w-2xl mx-auto shadow-sm">
              <div className="flex items-center justify-center space-x-2">
                <Shield className="h-5 w-5 text-green-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-gray-800">
                  🔒 Vos données sont protégées et ne sont jamais stockées sur nos serveurs
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CompletePaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <CompletePaymentContent />
    </Suspense>
  )
} 