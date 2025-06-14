'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreditCard, Calendar, User, CheckCircle, AlertCircle, Star, Crown, Shield } from 'lucide-react'

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

export default function CustomerSubscriptionPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserData()
    fetchSubscriptionData()
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
                        <p className="text-xs text-blue-600 mt-1">
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
                <Button variant="outline" className="flex-1 h-10 sm:h-auto text-sm">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Changer de plan
                </Button>
                <Button variant="outline" className="h-10 sm:h-auto text-sm">
                  Gérer le paiement
                </Button>
                {subscription.autoRenew && (
                  <Button variant="outline" className="text-red-600 hover:text-red-700 h-10 sm:h-auto text-sm">
                    Annuler l'abonnement
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
    </div>
  )
} 