'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, AlertCircle, CheckCircle, ArrowLeft, ArrowUp, Crown, Shield, User, Star, Calendar } from 'lucide-react'

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

interface UpgradeData {
  currentSubscriptionId: string
  currentPlan: {
    id: string
    name: string
    price: string
    period: string
  }
  newPlan: {
    id: string
    name: string
    price: string
    period: string
  }
  daysRemaining: number
  upgradeCost: number
  currency: string
}

interface PaymentData {
  id: string
  amount: number
  currency: string
  description: string
  status: string
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
          <ArrowLeft className="h-4 w-4 mr-2" />
          Changer de méthode
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
          Finalisez votre mise à niveau pour accéder aux nouvelles fonctionnalités
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

export default function UpgradePaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [upgradeData, setUpgradeData] = useState<UpgradeData | null>(null)
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  const newPlanId = searchParams.get('planId')
  const isRenewal = searchParams.get('renewal') === 'true'

  const fetchUserData = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }, [])

  const initiateUpgrade = useCallback(async () => {
    if (!newPlanId) return

    try {
      setLoading(true)
      const response = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPlanId,
          isRenewal
        }),
      })

      const data = await response.json()

      if (data.success) {
        setUpgradeData(data.data.upgrade)
        setPaymentData(data.data.payment)
      } else {
        setError(data.error || 'Erreur lors de la préparation de la mise à niveau')
      }
    } catch (error) {
      console.error('Error initiating upgrade:', error)
      setError('Erreur lors de la préparation de la mise à niveau')
    } finally {
      setLoading(false)
    }
  }, [newPlanId, isRenewal])

  useEffect(() => {
    if (!newPlanId) {
      setError('Plan non spécifié')
      setLoading(false)
      return
    }

    fetchUserData()
    initiateUpgrade()
  }, [newPlanId, fetchUserData, initiateUpgrade])

  const handlePaymentSuccess = async (paymentResult: any) => {
    try {
      console.log('Payment success result:', paymentResult)
      
      // For Stripe, we get the payment intent ID, for Mollie we get the payment ID
      const paymentId = paymentResult.paymentId || paymentResult.paymentIntentId || paymentResult.id || paymentData?.id
      
      console.log('Extracted payment ID:', paymentId)
      console.log('Payment data ID:', paymentData?.id)
      
      if (!paymentId) {
        console.error('No payment ID found in result or payment data')
        // If we don't have a payment ID, wait a bit and check latest payment
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        try {
          const latestResponse = await fetch('/api/payments/latest')
          const latestData = await latestResponse.json()
          
          if (latestData.success && latestData.payment) {
            console.log('Found latest payment:', latestData.payment.id)
            const latestPaymentId = latestData.payment.id
            
            // Try to complete with latest payment
            const response = await fetch('/api/subscriptions/upgrade/complete', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ paymentId: latestPaymentId }),
            })
            
            const data = await response.json()
            if (data.success) {
              setPaymentSuccess(true)
              setTimeout(() => {
                router.push('/admin/subscription')
              }, 5000)
              return
            }
          }
        } catch (latestError) {
          console.error('Error fetching latest payment:', latestError)
        }
        
        // If all else fails, assume webhook will handle it
        setPaymentSuccess(true)
        setTimeout(() => {
          router.push('/admin/subscription')
        }, 5000)
        return
      }
      
      // Poll for payment completion (wait for webhook processing)
      const pollPaymentStatus = async (attempts = 0): Promise<boolean> => {
        if (attempts >= 10) { // Max 10 attempts (30 seconds)
          return false
        }

        try {
          const response = await fetch('/api/subscriptions/upgrade/complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ paymentId }),
          })

          const data = await response.json()

          if (data.success) {
            return true
          } else if (data.error?.includes('pas encore complété')) {
            // Payment not yet processed by webhook, wait and retry
            await new Promise(resolve => setTimeout(resolve, 3000)) // Wait 3 seconds
            return pollPaymentStatus(attempts + 1)
          } else {
            console.log('Upgrade complete API error:', data.error)
            // If the API fails but webhook might have processed it, assume success
            return true
          }
        } catch (error) {
          if (attempts < 5) { // Retry network errors up to 5 times
            await new Promise(resolve => setTimeout(resolve, 2000))
            return pollPaymentStatus(attempts + 1)
          }
          throw error
        }
      }

      const success = await pollPaymentStatus()
      
      if (success) {
        setPaymentSuccess(true)
        // Redirect to subscription page after 5 seconds to give user time to see success message
        setTimeout(() => {
          router.push('/admin/subscription')
        }, 5000)
      } else {
        setError('Le paiement a été effectué mais la mise à niveau prend plus de temps que prévu. Veuillez vérifier votre abonnement.')
      }
    } catch (error) {
      console.error('Error completing upgrade:', error)
      setError('Erreur lors de la finalisation de la mise à niveau')
    }
  }

  const handlePaymentError = (error: string) => {
    setError(error)
  }

  const getPlanIcon = (planName: string) => {
    const lowerName = planName.toLowerCase()
    if (lowerName.includes('pro') || lowerName.includes('enterprise')) {
      return <Crown className="h-5 w-5 text-purple-600" />
    } else if (lowerName.includes('standard') || lowerName.includes('business')) {
      return <Shield className="h-5 w-5 text-blue-600" />
    } else {
      return <User className="h-5 w-5 text-green-600" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <h2 className="text-xl font-semibold">
                {isRenewal ? 'Préparation du renouvellement' : 'Préparation de la mise à niveau'}
              </h2>
              <p className="text-muted-foreground">Veuillez patienter...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
              <h2 className="text-xl font-semibold text-red-800">Erreur</h2>
              <p className="text-red-600">{error}</p>
              <Button 
                variant="outline" 
                onClick={() => router.push('/admin/subscription')}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'abonnement
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
              <h2 className="text-2xl font-bold text-green-800">
                {isRenewal ? 'Renouvellement réussi !' : 'Mise à niveau réussie !'}
              </h2>
              <div className="space-y-3">
                <p className="text-green-600 text-lg">
                  {isRenewal 
                    ? `Votre abonnement au plan ${upgradeData?.newPlan.name} a été renouvelé avec succès`
                    : `Votre abonnement a été mis à niveau vers le plan ${upgradeData?.newPlan.name}`
                  }
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-700">
                    ✨ {isRenewal 
                      ? 'Votre abonnement est maintenant prolongé et toutes les fonctionnalités restent disponibles.'
                      : 'Votre nouveau plan est maintenant actif et toutes les fonctionnalités sont disponibles immédiatement.'
                    }
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Redirection automatique dans 5 secondes...
                </p>
              </div>
              <Button 
                onClick={() => router.push('/admin/subscription')}
                className="w-full"
              >
                Voir mon abonnement
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!upgradeData || !paymentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-orange-500" />
              <h2 className="text-xl font-semibold">Données manquantes</h2>
              <p className="text-muted-foreground">Impossible de charger les informations de mise à niveau</p>
              <Button 
                variant="outline" 
                onClick={() => router.push('/admin/subscription')}
                className="w-full"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour à l'abonnement
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin/subscription" className="flex items-center space-x-2 text-primary hover:text-primary/80">
              <ArrowLeft className="h-4 w-4" />
              <span className="font-medium">Retour à l'abonnement</span>
            </Link>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold text-primary">Vistream</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              {isRenewal ? (
                <Calendar className="h-8 w-8 text-primary mr-2" />
              ) : (
                <ArrowUp className="h-8 w-8 text-primary mr-2" />
              )}
              <h1 className="text-3xl font-bold">
                {isRenewal ? 'Renouvellement' : 'Mise à niveau'}
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              {isRenewal 
                ? 'Renouvelez votre abonnement pour continuer à profiter de nos services'
                : 'Accédez à plus de fonctionnalités avec votre nouveau plan'
              }
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Payment Section - Left side */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <CreditCard className="h-6 w-6" />
                    Modalités de paiement
                  </CardTitle>
                  <CardDescription className="text-base">
                    {isRenewal ? 'Finalisez votre renouvellement' : 'Finalisez votre mise à niveau'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PaymentMethodSelector
                    amount={upgradeData.upgradeCost}
                    currency={upgradeData.currency}
                    description={isRenewal 
                      ? `Renouvellement ${upgradeData.newPlan.name}` 
                      : `Mise à niveau vers ${upgradeData.newPlan.name}`
                    }
                    customerEmail={user?.email}
                    customerName={`${user?.firstName} ${user?.lastName}`}
                    metadata={{
                      type: isRenewal ? 'subscription_renewal' : 'subscription_upgrade',
                      currentSubscriptionId: upgradeData.currentSubscriptionId,
                      currentPlan: upgradeData.currentPlan.name,
                      newPlanId: upgradeData.newPlan.id,
                      newPlan: upgradeData.newPlan.name,
                      userId: user?.email || '',
                      isRenewal: isRenewal
                    }}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Benefits and Recap - Right side, larger */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Avantages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">Accès immédiat aux nouvelles fonctionnalités</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">Extension de votre abonnement</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">Support prioritaire</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">Aucune interruption de service</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">Facturation simplifiée</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Operation Summary */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ArrowUp className="h-4 w-4 text-blue-600" />
                    Récapitulatif
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Plan actuel :</span>
                    <span className="font-medium">{upgradeData.currentPlan.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Nouveau plan :</span>
                    <span className="font-medium text-blue-700">{upgradeData.newPlan.name}</span>
                  </div>
                  <div className="border-t border-blue-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Total :</span>
                      <span className="text-lg font-bold text-blue-700">
                        {upgradeData.upgradeCost.toFixed(2)} {upgradeData.currency}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                    ✨ Activation immédiate après paiement
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 