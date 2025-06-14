'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Users, 
  UserCheck, 
  UserX, 
  Crown,
  Shield,
  User,
  TrendingUp,
  Activity,
  Calendar,
  AlertTriangle,
  Clock,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  verifiedUsers: number
  adminUsers: number
  userUsers: number
  customerUsers: number
  recentUsers: number
}

interface ExpiringSubscription {
  _id: string
  userId: {
    _id: string
    name: string
    email: string
  }
  planName: string
  planPrice: number
  planPeriod: string
  endDate: string
  status: string
}

interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  phonePrefix: string
  phoneNumber: string
  role: 'admin' | 'user' | 'customer'
  isVerified: boolean
  isActive: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
  subscription?: {
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
  } | null
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    verifiedUsers: 0,
    adminUsers: 0,
    userUsers: 0,
    customerUsers: 0,
    recentUsers: 0
  })
  const [expiringSubscriptions, setExpiringSubscriptions] = useState<ExpiringSubscription[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingExpiring, setLoadingExpiring] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  useEffect(() => {
    fetchStats()
    fetchExpiringSubscriptions()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      // For now, we'll fetch basic user stats from the users API
      const response = await fetch('/api/admin/users?limit=1000')
      const data = await response.json()

      if (data.success) {
        const users = data.data.users
        const now = new Date()
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        const calculatedStats: DashboardStats = {
          totalUsers: users.length,
          activeUsers: users.filter((u: any) => u.isActive).length,
          verifiedUsers: users.filter((u: any) => u.isVerified).length,
          adminUsers: users.filter((u: any) => u.role === 'admin').length,
          userUsers: users.filter((u: any) => u.role === 'user').length,
          customerUsers: users.filter((u: any) => u.role === 'customer').length,
          recentUsers: users.filter((u: any) => new Date(u.createdAt) >= sevenDaysAgo).length
        }

        setStats(calculatedStats)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExpiringSubscriptions = async () => {
    try {
      setLoadingExpiring(true)
      const response = await fetch('/api/admin/subscriptions/expiring')
      const data = await response.json()

      if (data.success) {
        setExpiringSubscriptions(data.data)
      }
    } catch (error) {
      console.error('Error fetching expiring subscriptions:', error)
    } finally {
      setLoadingExpiring(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getDaysUntilExpiry = (endDate: string) => {
    const now = new Date()
    const expiry = new Date(endDate)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'pro':
        return Crown
      case 'standard':
        return Shield
      default:
        return User
    }
  }

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'pro':
        return 'text-yellow-600 bg-yellow-100'
      case 'standard':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const fetchUserDetails = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      const data = await response.json()

      if (data.success) {
        setSelectedUser(data.data)
        setIsDetailDialogOpen(true)
      } else {
        alert('Erreur lors de la récupération des détails de l\'utilisateur: ' + data.error)
      }
    } catch (error) {
      alert('Erreur lors de la récupération des détails de l\'utilisateur')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3" />
      case 'customer':
        return <User className="h-3 w-3" />
      default:
        return <Shield className="h-3 w-3" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'customer':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getSubscriptionBadge = (subscription: any) => {
    if (!subscription) {
      return <Badge variant="outline">Aucun abonnement</Badge>
    }

    const PlanIcon = getPlanIcon(subscription.planName)
    const planColor = getPlanColor(subscription.planName)

    return (
      <Badge className={`${planColor} border`}>
        <div className="flex items-center gap-1">
          <PlanIcon className="h-3 w-3" />
          {subscription.planName}
        </div>
      </Badge>
    )
  }

  const statCards = [
    {
      title: 'Total Utilisateurs',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Utilisateurs Actifs',
      value: stats.activeUsers,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Comptes Vérifiés',
      value: stats.verifiedUsers,
      icon: Shield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Nouveaux (7j)',
      value: stats.recentUsers,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ]

  const roleCards = [
    {
      title: 'Administrateurs',
      value: stats.adminUsers,
      icon: Crown,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'Utilisateurs',
      value: stats.userUsers,
      icon: Shield,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Clients',
      value: stats.customerUsers,
      icon: User,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ]

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Activity className="h-8 w-8" />
          Tableau de Bord Administrateur
        </h1>
        <p className="text-muted-foreground mt-2">
          Vue d'ensemble de la plateforme et des utilisateurs
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold mt-2">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expiring Subscriptions Widget */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Abonnements Expirant Bientôt
            <Badge variant="outline" className="ml-2">
              {expiringSubscriptions.length}
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Abonnements qui expirent dans les 30 prochains jours
          </p>
        </CardHeader>
        <CardContent>
          {loadingExpiring ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : expiringSubscriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun abonnement n'expire dans les 30 prochains jours</p>
            </div>
          ) : (
            <div className="space-y-4">
              {expiringSubscriptions.map((subscription) => {
                const PlanIcon = getPlanIcon(subscription.planName)
                const daysLeft = getDaysUntilExpiry(subscription.endDate)
                const isUrgent = daysLeft <= 7
                
                return (
                  <div 
                    key={subscription._id} 
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      isUrgent ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getPlanColor(subscription.planName)}`}>
                        <PlanIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{subscription.userId.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {subscription.userId.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {subscription.planName}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {subscription.planPrice}€/{subscription.planPeriod}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <div className={`flex items-center gap-1 ${
                        isUrgent ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">
                          {daysLeft} jour{daysLeft > 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Expire le {formatDate(subscription.endDate)}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchUserDetails(subscription.userId._id)}
                        className="mt-1"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Voir détails
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Répartition par Rôles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roleCards.map((role, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${role.bgColor}`}>
                      <role.icon className={`h-4 w-4 ${role.color}`} />
                    </div>
                    <span className="font-medium">{role.title}</span>
                  </div>
                  <Badge variant="secondary" className="text-lg font-bold">
                    {role.value}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Activité Récente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-green-100">
                    <UserCheck className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Utilisateurs Actifs</p>
                    <p className="text-sm text-muted-foreground">
                      {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}% du total
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg font-bold">
                  {stats.activeUsers}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-purple-100">
                    <Shield className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Comptes Vérifiés</p>
                    <p className="text-sm text-muted-foreground">
                      {((stats.verifiedUsers / stats.totalUsers) * 100).toFixed(1)}% du total
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg font-bold">
                  {stats.verifiedUsers}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-orange-100">
                    <TrendingUp className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">Nouveaux (7 jours)</p>
                    <p className="text-sm text-muted-foreground">
                      Croissance récente
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg font-bold">
                  {stats.recentUsers}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/admin/users"
              className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <Users className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-medium">Gérer les Utilisateurs</p>
                <p className="text-sm text-muted-foreground">
                  Créer, modifier, supprimer
                </p>
              </div>
            </a>

            <a
              href="/admin/settings"
              className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Activity className="h-6 w-6 text-gray-600" />
              <div>
                <p className="font-medium">Paramètres</p>
                <p className="text-sm text-muted-foreground">
                  Configuration système
                </p>
              </div>
            </a>

            <a
              href="/dashboard"
              className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <TrendingUp className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium">Retour au Site</p>
                <p className="text-sm text-muted-foreground">
                  Vue utilisateur
                </p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* User Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de l'utilisateur</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Nom complet</Label>
                  <p className="text-sm text-gray-900 mt-1">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Email</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedUser.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Téléphone</Label>
                  <p className="text-sm text-gray-900 mt-1">
                    {selectedUser.phonePrefix} {selectedUser.phoneNumber}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Rôle</Label>
                  <div className="mt-1">
                    <Badge className={getRoleBadgeColor(selectedUser.role)}>
                      <div className="flex items-center gap-1">
                        {getRoleIcon(selectedUser.role)}
                        {selectedUser.role}
                      </div>
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Statut du compte</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedUser.isActive ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      {selectedUser.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Vérification</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedUser.isVerified ? (
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    )}
                    <span className="text-sm">
                      {selectedUser.isVerified ? 'Vérifié' : 'Non vérifié'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subscription Details */}
              {selectedUser.subscription && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Abonnement</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Plan</Label>
                      <div className="mt-1">
                        {getSubscriptionBadge(selectedUser.subscription)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Prix</Label>
                      <p className="text-sm text-gray-900 mt-1">
                        {selectedUser.subscription.planPrice}/{selectedUser.subscription.planPeriod}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Date de début</Label>
                      <p className="text-sm text-gray-900 mt-1">
                        {formatDate(selectedUser.subscription.startDate)}
                      </p>
                    </div>
                    {selectedUser.subscription.endDate && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Date de fin</Label>
                        <p className="text-sm text-gray-900 mt-1">
                          {formatDate(selectedUser.subscription.endDate)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="border-t pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Créé le</Label>
                    <p className="text-sm text-gray-900 mt-1">
                      {formatDate(selectedUser.createdAt)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Modifié le</Label>
                    <p className="text-sm text-gray-900 mt-1">
                      {formatDate(selectedUser.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 