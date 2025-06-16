'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CreditCard, Calendar, User, CheckCircle, AlertCircle, Star, Crown, Shield, ArrowUp, Loader2, Check, X, RefreshCw } from 'lucide-react'

interface UserData {
  firstName: string
  lastName: string
  email: string
  createdAt: string
  isVerified: boolean
  role: string
}

interface SubscriptionData {
  _id: string
  planId: string
  planName: string
  planPrice: string
  planPeriod: string
  status: 'active' | 'inactive' | 'cancelled' | 'expired'
  startDate: string
  endDate?: string
  autoRenew: boolean
  createdAt: string
  updatedAt: string
}

interface Plan {
  _id: string
  name: string
  description: string
  price: string
  period: string
  highlight: boolean
  features: string[]
  isActive: boolean
  order: number
}

interface UpgradeData {
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

export default function CustomerSubscriptionPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([])
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false)
  const [upgradeError, setUpgradeError] = useState<string>('')

  useEffect(() => {
    fetchUserData()
    fetchSubscriptionData()
    fetchAvailablePlans()

    // Refresh data when user returns to the page (e.g., from upgrade payment)
    const handleFocus = () => {
      fetchSubscriptionData()
    }

    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  const fetchSubscriptionData = async () => {
    try {
      const response = await fetch('/api/admin/subscription')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.subscription) {
          setSubscription(data.data.subscription)
        }
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailablePlans = async () => {
    try {
      const response = await fetch('/api/plans')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setAvailablePlans(data.data.plans || [])
        }
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  const handleUpgradeClick = () => {
    if (!subscription || !isSubscriptionActive) {
      setUpgradeError('Vous devez avoir un abonnement actif pour effectuer une mise à niveau')
      return
    }
    setIsUpgradeDialogOpen(true)
    setUpgradeError('')
  }

  const handlePlanUpgrade = (planId: string) => {
    // Redirect to upgrade payment page without provider - user will choose on payment page
    router.push(`/admin/upgrade-payment?planId=${planId}`)
  }

  const resetUpgradeDialog = () => {
    setIsUpgradeDialogOpen(false)
    setUpgradeError('')
  }

  const handleRefresh = async () => {
    setLoading(true)
    await Promise.all([
      fetchUserData(),
      fetchSubscriptionData(),
      fetchAvailablePlans()
    ])
  }

  const handleRenewal = (planId?: string) => {
    // Use current plan ID if no specific plan is provided
    const renewalPlanId = planId || subscription?.planId
    if (renewalPlanId) {
      router.push(`/admin/upgrade-payment?planId=${renewalPlanId}&renewal=true`)
    }
  }

  const getDaysUntilExpiry = () => {
    if (!subscription?.endDate) return null
    const now = new Date()
    const endDate = new Date(subscription.endDate)
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const isExpiringSoon = () => {
    const daysUntilExpiry = getDaysUntilExpiry()
    return daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0
  }

  const isExpired = () => {
    const daysUntilExpiry = getDaysUntilExpiry()
    return daysUntilExpiry !== null && daysUntilExpiry <= 0
  }

  const getPlanIcon = (planName: string) => {
    const lowerName = planName.toLowerCase()
    if (lowerName.includes('pro') || lowerName.includes('enterprise')) {
      return <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
    } else if (lowerName.includes('standard') || lowerName.includes('business')) {
      return <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
    } else {
      return <User className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
    }
  }

  const getAvailableUpgradePlans = () => {
    if (!subscription) return []
    
    // Parse current plan price for comparison
    const currentPrice = parseFloat(subscription.planPrice.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
    
    // Return plans that are more expensive than current plan
    return availablePlans.filter(plan => {
      const planPrice = parseFloat(plan.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
      return planPrice > currentPrice && plan.isActive
    }).sort((a, b) => {
      const priceA = parseFloat(a.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
      const priceB = parseFloat(b.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
      return priceA - priceB
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs px-2 py-0.5 h-5 w-fit">Actif</Badge>
      case 'inactive':
        return <Badge variant="outline" className="text-gray-600 text-xs px-2 py-0.5 h-5 w-fit">Inactif</Badge>
      case 'cancelled':
        return <Badge variant="outline" className="text-red-600 border-red-200 text-xs px-2 py-0.5 h-5 w-fit">Annulé</Badge>
      case 'expired':
        return <Badge variant="outline" className="text-orange-600 border-orange-200 text-xs px-2 py-0.5 h-5 w-fit">Expiré</Badge>
      default:
        return <Badge variant="outline" className="text-xs px-2 py-0.5 h-5 w-fit">Inconnu</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const isSubscriptionActive = subscription?.status === 'active' && 
    (!subscription?.endDate || new Date(subscription.endDate) > new Date())

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="bg-blue-100 p-2 sm:p-3 rounded-full flex-shrink-0">
            <User className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              Bienvenue, {user?.firstName} {user?.lastName} !
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {subscription ? `Abonnement ${subscription.planName} actif` : 'Gérez votre abonnement et vos préférences'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Account Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {/* Account Status */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Statut du compte</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                {user?.isVerified ? 'Vérifié' : 'En attente'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Compte créé le {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
            </p>
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <Card className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Abonnement</CardTitle>
            <div className="flex-shrink-0">
              {subscription ? getPlanIcon(subscription.planName) : <CreditCard className="h-4 w-4 text-blue-600" />}
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
              {subscription ? (
                <>
                  {getStatusBadge(subscription.status)}
                  <span className="text-xs sm:text-sm font-medium truncate">{subscription.planName}</span>
                </>
              ) : (
                <Badge variant="outline" className="text-orange-600 border-orange-200 text-xs w-fit">
                  Aucun abonnement
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {subscription ? `${subscription.planPrice}/${subscription.planPeriod}` : 'Choisissez un plan pour commencer'}
            </p>
          </CardContent>
        </Card>

        {/* Next Billing */}
        <Card className="shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium">Prochaine facturation</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600 flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="flex items-center space-x-2">
              {subscription?.endDate ? (
                <Badge variant="outline" className={`text-xs ${isSubscriptionActive ? "text-green-600" : "text-red-600"}`}>
                  {formatDate(subscription.endDate)}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-600 text-xs">
                  N/A
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {subscription?.endDate ? 
                (isSubscriptionActive ? 'Renouvellement automatique' : 'Abonnement expiré') : 
                'Aucun abonnement actif'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Management */}
      <Card className="shadow-sm">
        <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span>Gestion de l'abonnement</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
          {subscription ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Expiry Warning */}
              {(isExpiringSoon() || isExpired()) && (
                <div className={`border rounded-lg p-4 sm:p-6 ${
                  isExpired() 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-orange-50 border-orange-200'
                }`}>
                  <div className="flex items-start space-x-3">
                    <AlertCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                      isExpired() ? 'text-red-600' : 'text-orange-600'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <h3 className={`font-medium text-sm sm:text-base ${
                        isExpired() ? 'text-red-900' : 'text-orange-900'
                      }`}>
                        {isExpired() ? 'Abonnement expiré' : 'Abonnement expire bientôt'}
                      </h3>
                      <p className={`text-xs sm:text-sm mt-1 ${
                        isExpired() ? 'text-red-700' : 'text-orange-700'
                      }`}>
                        {isExpired() 
                          ? `Votre abonnement a expiré le ${formatDate(subscription.endDate!)}. Renouvelez-le pour continuer à utiliser nos services.`
                          : `Votre abonnement expire dans ${getDaysUntilExpiry()} jour${getDaysUntilExpiry()! > 1 ? 's' : ''} (${formatDate(subscription.endDate!)}). Renouvelez-le maintenant pour éviter toute interruption.`
                        }
                      </p>
                      <Button 
                        size="sm" 
                        className={`mt-3 ${
                          isExpired() 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-orange-600 hover:bg-orange-700'
                        }`}
                        onClick={() => handleRenewal()}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        Renouveler maintenant
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Current Plan Details */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getPlanIcon(subscription.planName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-blue-900 flex items-center gap-2 text-sm sm:text-base">
                        Plan {subscription.planName}
                        {subscription.planName.toLowerCase().includes('standard') && (
                          <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 flex-shrink-0" />
                        )}
                      </h3>
                      <p className="text-xs sm:text-sm text-blue-700 mt-1">
                        {subscription.planPrice}/{subscription.planPeriod} • 
                        Actif depuis le {formatDate(subscription.startDate)}
                      </p>
                      {subscription.endDate && (
                        <p className={`text-xs mt-1 ${
                          isExpired() ? 'text-red-600' : 
                          isExpiringSoon() ? 'text-orange-600' : 'text-blue-600'
                        }`}>
                          {isSubscriptionActive ? 
                            `Expire le ${formatDate(subscription.endDate)}` : 
                            `Expiré le ${formatDate(subscription.endDate)}`
                          }
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {getStatusBadge(subscription.status)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {/* Renewal Button - Priority for expired/expiring subscriptions */}
                {(isExpired() || isExpiringSoon()) && (
                  <Button 
                    className={`flex-1 h-10 sm:h-auto text-sm ${
                      isExpired() 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-orange-600 hover:bg-orange-700'
                    }`}
                    onClick={() => handleRenewal()}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {isExpired() ? 'Renouveler l\'abonnement' : 'Renouveler maintenant'}
                  </Button>
                )}
                
                {/* Upgrade Button - Only show if subscription is active and not expiring soon */}
                {isSubscriptionActive && !isExpiringSoon() && !isExpired() && (
                  <Button 
                    variant="outline" 
                    className="flex-1 h-10 sm:h-auto text-sm"
                    onClick={handleUpgradeClick}
                    disabled={getAvailableUpgradePlans().length === 0}
                  >
                    <ArrowUp className="mr-2 h-4 w-4" />
                    {getAvailableUpgradePlans().length > 0 ? 'Mettre à niveau' : 'Aucune mise à niveau disponible'}
                  </Button>
                )}

                {/* Renewal Button for active subscriptions (secondary) */}
                {isSubscriptionActive && !isExpiringSoon() && !isExpired() && (
                  <Button 
                    variant="outline" 
                    className="h-10 sm:h-auto text-sm"
                    onClick={() => handleRenewal()}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Renouveler
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-medium text-blue-900 text-sm sm:text-base">Aucun abonnement actif</h3>
                    <p className="text-xs sm:text-sm text-blue-700 mt-1">
                      Vous n'avez actuellement aucun abonnement. Choisissez un plan pour accéder à toutes les fonctionnalités de Vistream.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button className="flex-1 h-10 sm:h-auto text-sm" onClick={() => window.location.href = '/#pricing'}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Choisir un abonnement
                </Button>
                <Button variant="outline" className="h-10 sm:h-auto text-sm" onClick={() => window.location.href = '/#pricing'}>
                  Voir les tarifs
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card className="shadow-sm">
        <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <User className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span>Informations du compte</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700">Nom complet</label>
              <p className="text-sm sm:text-base text-gray-900 mt-1 truncate">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700">Email</label>
              <p className="text-sm sm:text-base text-gray-900 mt-1 truncate">{user?.email}</p>
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700">Type de compte</label>
              <p className="text-sm sm:text-base text-gray-900 mt-1 capitalize">{user?.role}</p>
            </div>
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700">Membre depuis</label>
              <p className="text-sm sm:text-base text-gray-900 mt-1">
                {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
              </p>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full sm:w-auto h-9 text-sm" 
              onClick={() => window.location.href = '/admin/profile'}
            >
              Modifier les informations
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      <Dialog open={isUpgradeDialogOpen} onOpenChange={resetUpgradeDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUp className="h-5 w-5" />
              Mettre à niveau votre abonnement
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {upgradeError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{upgradeError}</p>
              </div>
            )}

            <div>
              <h3 className="text-lg font-medium mb-4">Sélectionnez votre nouveau plan</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {getAvailableUpgradePlans().map((plan) => (
                  <Card 
                    key={plan._id} 
                    className="cursor-pointer transition-all hover:shadow-md hover:ring-2 hover:ring-blue-500"
                                                    onClick={() => handlePlanUpgrade(plan._id)}
                  >
                    <CardHeader className="text-center pb-2">
                      <div className="flex items-center justify-center mb-2">
                        {getPlanIcon(plan.name)}
                      </div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <div className="text-2xl font-bold text-blue-600">
                        {plan.price}
                        <span className="text-sm font-normal text-gray-600">/{plan.period}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                      <ul className="space-y-1">
                        {plan.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                        {plan.features.length > 3 && (
                          <li className="text-xs text-gray-500">
                            +{plan.features.length - 3} autres fonctionnalités
                          </li>
                        )}
                      </ul>
                      <Button className="w-full mt-4" size="sm">
                        Choisir ce plan
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {getAvailableUpgradePlans().length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">Aucune mise à niveau disponible pour votre plan actuel.</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 