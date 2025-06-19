'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowUp, ArrowLeft, CheckCircle, CreditCard, Star, Crown, Shield } from 'lucide-react'
import { RoleGuard } from '@/components/ui/role-guard'

interface Subscription {
  _id: string
  planId: string
  planName: string
  planPrice: string
  planPeriod: string
  status: string
  startDate: string
  endDate: string
  autoRenew: boolean
}

interface Plan {
  _id: string
  name: string
  price: string
  period: string
  features: string[]
  isPopular: boolean
}

export default function UpgradePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const targetPlanId = searchParams.get('planId')
  
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
  const [targetPlan, setTargetPlan] = useState<Plan | null>(null)
  const [allPlans, setAllPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadUpgradeData = useCallback(async () => {
    try {
      // Get current subscription
      const subResponse = await fetch('/api/admin/subscription')
      const subData = await subResponse.json()

      if (!subData.success || !subData.data?.subscription) {
        router.push('/admin/subscription')
        return
      }

      setSubscription(subData.data.subscription)

      // Get all plans
      const planResponse = await fetch(`/api/plans`)
      const planData = await planResponse.json()

      if (planData.success) {
        const plans = planData.data?.plans || planData.plans || []
        setAllPlans(plans)
        
        const current = plans.find((p: Plan) => p._id === subData.data.subscription.planId)
        setCurrentPlan(current || null)
        
        if (targetPlanId) {
          const target = plans.find((p: Plan) => p._id === targetPlanId)
          setTargetPlan(target || null)
        }
      }

    } catch (error) {
      console.error('Error loading upgrade data:', error)
      setError('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }, [router, targetPlanId])

  useEffect(() => {
    loadUpgradeData()
  }, [loadUpgradeData])

  const handleUpgrade = async (planId: string) => {
    if (!subscription) return

    setCreating(true)
    setError(null)

    try {
      // Create payment session for upgrade
      const response = await fetch('/api/payments/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'upgrade',
          planId: planId,
          subscriptionId: subscription._id
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Redirect to payment page
        router.push('/auth/payment')
      } else {
        setError(data.error || 'Erreur lors de la création de la session de paiement')
      }
    } catch (error) {
      console.error('Error creating upgrade session:', error)
      setError('Erreur de connexion')
    } finally {
      setCreating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getPlanIcon = (planName: string) => {
    const lowerName = planName.toLowerCase()
    if (lowerName.includes('pro') || lowerName.includes('enterprise')) {
      return <Crown className="h-5 w-5 text-purple-600" />
    } else if (lowerName.includes('standard') || lowerName.includes('business')) {
      return <Shield className="h-5 w-5 text-blue-600" />
    } else {
      return <Star className="h-5 w-5 text-green-600" />
    }
  }

  const getUpgradablePlans = () => {
    if (!currentPlan || !allPlans) return []
    
    const currentPrice = parseFloat(currentPlan.price)
    return allPlans.filter(plan => {
      const planPrice = parseFloat(plan.price)
      return plan._id !== currentPlan._id && planPrice > currentPrice
    })
  }

  const calculateUpgradeCost = (newPlan: Plan) => {
    if (!currentPlan) return parseFloat(newPlan.price)
    
    const currentPrice = parseFloat(currentPlan.price)
    const newPrice = parseFloat(newPlan.price)
    
    // Simplified calculation - in production you might want prorated pricing
    return Math.max(0, newPrice - currentPrice)
  }

  if (loading) {
    return (
      <RoleGuard allowedRoles={['admin', 'user', 'customer']}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <h2 className="text-xl font-semibold">Chargement</h2>
                <p className="text-muted-foreground">Préparation de la mise à niveau...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </RoleGuard>
    )
  }

  const upgradablePlans = getUpgradablePlans()

  return (
    <RoleGuard allowedRoles={['admin', 'user', 'customer']}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => router.push('/admin/subscription')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Retour à l'abonnement</span>
              </Button>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-primary">Vistream</span>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <ArrowUp className="h-8 w-8 text-primary mr-2" />
                <h1 className="text-3xl font-bold">Mettre à niveau votre abonnement</h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Accédez à plus de fonctionnalités avec un plan supérieur
              </p>
            </div>

            {error && (
              <Card className="mb-6 border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <p className="text-red-600">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Current Plan */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="flex items-center">
                    {currentPlan && getPlanIcon(currentPlan.name)}
                    <span className="ml-2">Plan actuel</span>
                  </div>
                  <Badge variant="default" className="ml-2 bg-green-100 text-green-800">
                    Actif
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Votre abonnement actuel
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscription && currentPlan ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Plan</label>
                      <p className="text-lg font-semibold">{currentPlan.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Prix</label>
                      <p className="text-lg font-semibold">{currentPlan.price}€ / {currentPlan.period}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Expire le</label>
                      <p className="text-sm text-gray-900">{formatDate(subscription.endDate)}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Chargement des détails...</p>
                )}
              </CardContent>
            </Card>

            {/* Available Upgrades */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center">Plans disponibles pour la mise à niveau</h2>
              
              {upgradablePlans.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <ArrowUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Aucune mise à niveau disponible
                      </h3>
                      <p className="text-gray-500">
                        Vous avez déjà le meilleur plan disponible.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upgradablePlans.map((plan) => {
                    const upgradeCost = calculateUpgradeCost(plan)
                    const isTarget = targetPlanId === plan._id
                    
                    return (
                      <Card 
                        key={plan._id} 
                        className={`relative ${isTarget ? 'border-primary shadow-lg' : ''} ${plan.isPopular ? 'border-purple-200' : ''}`}
                      >
                        {plan.isPopular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-purple-600 hover:bg-purple-700">
                              Populaire
                            </Badge>
                          </div>
                        )}
                        
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            {getPlanIcon(plan.name)}
                            <span className="ml-2">{plan.name}</span>
                          </CardTitle>
                          <CardDescription>
                            <div className="text-3xl font-bold text-primary">
                              {plan.price}€
                              <span className="text-sm font-normal text-muted-foreground">
                                /{plan.period}
                              </span>
                            </div>
                            {upgradeCost > 0 && (
                              <div className="text-lg font-semibold text-green-600 mt-1">
                                Mise à niveau: +{upgradeCost.toFixed(2)}€
                              </div>
                            )}
                          </CardDescription>
                        </CardHeader>
                        
                        <CardContent>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              {plan.features && plan.features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>
                            
                            <Button
                              onClick={() => handleUpgrade(plan._id)}
                              disabled={creating}
                              className="w-full"
                              variant={isTarget ? "default" : "outline"}
                            >
                              {creating ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Préparation...
                                </>
                              ) : (
                                <>
                                  <CreditCard className="mr-2 h-4 w-4" />
                                  Passer à ce plan
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Benefits */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Avantages de la mise à niveau</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Accès immédiat aux nouvelles fonctionnalités</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Aucune interruption de service</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Conservation de toutes vos données</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm">Support prioritaire inclus</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
} 