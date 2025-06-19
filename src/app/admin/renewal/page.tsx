'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Calendar, ArrowLeft, CheckCircle, CreditCard, CalendarDays } from 'lucide-react'
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

export default function RenewalPage() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSubscriptionData = useCallback(async () => {
    try {
      // Get current subscription
      const subResponse = await fetch('/api/admin/subscription')
      const subData = await subResponse.json()

      if (!subData.success || !subData.data?.subscription) {
        router.push('/admin/subscription')
        return
      }

      setSubscription(subData.data.subscription)

      // Get plan details
      const planResponse = await fetch(`/api/plans`)
      const planData = await planResponse.json()

      if (planData.success) {
        const plans = planData.data?.plans || planData.plans || []
        const currentPlan = plans.find((p: Plan) => p._id === subData.data.subscription.planId)
        setPlan(currentPlan || null)
      }

    } catch (error) {
      console.error('Error loading subscription data:', error)
      setError('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    loadSubscriptionData()
  }, [loadSubscriptionData])

  const handleRenewal = async () => {
    if (!subscription || !plan) return

    setCreating(true)
    setError(null)

    try {
      // Create payment session for renewal
      const response = await fetch('/api/payments/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'renewal',
          planId: plan._id,
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
      console.error('Error creating renewal session:', error)
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

  const getDaysUntilExpiry = () => {
    if (!subscription?.endDate) return 0
    const endDate = new Date(subscription.endDate)
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const getStatusBadge = () => {
    const daysLeft = getDaysUntilExpiry()
    
    if (daysLeft <= 0) {
      return (
        <Badge variant="destructive" className="ml-2">
          Expiré
        </Badge>
      )
    } else if (daysLeft <= 7) {
      return (
        <Badge variant="outline" className="ml-2 border-orange-500 text-orange-700">
          Expire bientôt
        </Badge>
      )
    } else {
      return (
        <Badge variant="default" className="ml-2 bg-green-100 text-green-800">
          Actif
        </Badge>
      )
    }
  }

  const calculateNewEndDate = () => {
    if (!plan || !subscription) return null
    
    // Start from current subscription's end date for renewal
    const newEndDate = new Date(subscription.endDate)
    
    if (plan.period.includes('12') || plan.period.includes('année') || plan.period.includes('an')) {
      newEndDate.setFullYear(newEndDate.getFullYear() + 1)
    } else if (plan.period.includes('24')) {
      newEndDate.setFullYear(newEndDate.getFullYear() + 2)
    } else {
      // Default to monthly
      newEndDate.setMonth(newEndDate.getMonth() + 1)
    }
    
    return newEndDate
  }

  const getNewEndDateFormatted = () => {
    const newEndDate = calculateNewEndDate()
    if (!newEndDate) return ''
    
    return newEndDate.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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
                <p className="text-muted-foreground">Préparation du renouvellement...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </RoleGuard>
    )
  }

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
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-primary mr-2" />
                <h1 className="text-3xl font-bold">Renouveler votre abonnement</h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Prolongez votre accès sans interruption de service
              </p>
            </div>

            {error && (
              <Card className="mb-6 border-red-200 bg-red-50">
                <CardContent className="pt-6">
                  <p className="text-red-600">{error}</p>
                </CardContent>
              </Card>
            )}

            {/* Current Subscription */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  Abonnement actuel
                  {getStatusBadge()}
                </CardTitle>
                <CardDescription>
                  Votre abonnement actuel et ses détails
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscription && plan ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Plan</label>
                        <p className="text-lg font-semibold">{plan.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Prix</label>
                        <p className="text-lg font-semibold">{plan.price} / {plan.period}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Date de début</label>
                        <p className="text-sm text-gray-900">{formatDate(subscription.startDate)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Date d'expiration</label>
                        <p className="text-sm text-gray-900">{formatDate(subscription.endDate)}</p>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <label className="text-sm font-medium text-gray-700">Jours restants</label>
                      <p className="text-2xl font-bold text-primary">{getDaysUntilExpiry()} jours</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Chargement des détails...</p>
                )}
              </CardContent>
            </Card>


            {/* Renewal Options */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Détails du renouvellement</CardTitle>
                <CardDescription>
                  Renouvelez votre plan actuel pour la même période
                </CardDescription>
              </CardHeader>
              <CardContent>
                {plan && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-blue-900">{plan.name}</h3>
                          <p className="text-sm text-blue-700">
                            Période de renouvellement : {plan.period}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-900">
                            {plan.price}
                          </div>
                          <div className="text-sm text-blue-700">
                            pour {plan.period}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* New End Date Preview */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <CalendarDays className="h-6 w-6 text-green-600" />
                          <div>
                            <h4 className="font-medium text-green-900">Nouvelle date d'expiration</h4>
                            <p className="text-sm text-green-700">
                              Après renouvellement
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-green-900">
                            {getNewEndDateFormatted()}
                          </div>
                                                     <div className="text-sm text-green-700">
                             Extension depuis la date d'expiration actuelle
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Avantages du renouvellement :</h4>
                      <ul className="space-y-1">
                        <li className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Aucune interruption de service
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Conservation de tous vos données
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Accès continu à toutes les fonctionnalités
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Support technique prioritaire
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Button */}
            <div className="text-center">
              <Button
                onClick={handleRenewal}
                disabled={creating || !subscription || !plan}
                size="lg"
                className="w-full max-w-md"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Préparation...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-5 w-5" />
                    Renouveler pour {plan?.price}
                  </>
                )}
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Vous serez redirigé vers la page de paiement sécurisée
              </p>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
} 