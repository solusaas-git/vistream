'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RoleGuard } from '@/components/ui/role-guard'
import { 
  Users, 
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Hash,
  Crown,
  Zap,
  Star,
  CreditCard
} from 'lucide-react'

// Types
interface Payment {
  id: string
  externalId: string
  provider: string
  status: string
  amount: {
    value: number
    currency: string
  }
  description: string
  method?: string
  createdAt: string
  paidAt?: string
  webhookProcessedAt?: string
  isProcessed?: boolean
}

interface Subscription {
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
  payments?: Payment[]
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
  affiliationCode?: string
  lastLogin?: string
  createdAt: string
  updatedAt: string
  subscription?: Subscription | null
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export default function CustomersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [customers, setCustomers] = useState<User[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [loadingPayments, setLoadingPayments] = useState(false)

  // Fetch customers
  const fetchCustomers = async (page = 1, search = '') => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        role: 'customer'
      })
      
      if (search) {
        params.append('search', search)
      }

      const response = await fetch(`/api/admin/users?${params}`)
      const data = await response.json()

      if (data.success) {
        setCustomers(data.data.users)
        setPagination(data.data.pagination)
      } else {
        console.error('Erreur lors du chargement des clients')
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      console.error('Erreur lors du chargement des clients')
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchCustomers()
  }, [])

  // Handle search
  const handleSearch = () => {
    fetchCustomers(1, searchTerm)
  }

  // Handle search on Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Fetch customer payments
  const fetchCustomerPayments = async (userId: string): Promise<Payment[]> => {
    try {
      setLoadingPayments(true)
      const response = await fetch(`/api/admin/payments?userId=${userId}`)
      const data = await response.json()
      
      if (data.success && data.data?.payments) {
        return data.data.payments
      }
      return []
    } catch (error) {
      console.error('Error fetching customer payments:', error)
      return []
    } finally {
      setLoadingPayments(false)
    }
  }

  // Utility functions
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3" />
      case 'user':
        return <Users className="h-3 w-3" />
      case 'customer':
        return <Users className="h-3 w-3" />
      default:
        return <Users className="h-3 w-3" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 hover:bg-red-200'
      case 'user':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      case 'customer':
        return 'bg-green-100 text-green-800 hover:bg-green-200'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  const getPlanIcon = (planName: string) => {
    const plan = planName.toLowerCase()
    if (plan.includes('premium') || plan.includes('pro')) {
      return <Crown className="h-3 w-3" />
    } else if (plan.includes('plus') || plan.includes('advanced')) {
      return <Zap className="h-3 w-3" />
    } else {
      return <Star className="h-3 w-3" />
    }
  }

  const getSubscriptionBadge = (subscription: Subscription | null) => {
    if (!subscription) {
      return (
        <Badge variant="outline" className="bg-gray-50 text-gray-600">
          Aucun abonnement
        </Badge>
      )
    }

    const statusColors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-600',
      cancelled: 'bg-red-100 text-red-800',
      expired: 'bg-orange-100 text-orange-800'
    }

    return (
      <Badge className={statusColors[subscription.status] || statusColors.inactive}>
        <div className="flex items-center gap-1">
          {getPlanIcon(subscription.planName)}
          {subscription.planName}
        </div>
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getPaymentStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { 
        className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200', 
        icon: CheckCircle, 
        iconColor: 'text-green-600' 
      },
      pending: { 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200', 
        icon: AlertTriangle, 
        iconColor: 'text-yellow-600' 
      },
      failed: { 
        className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200', 
        icon: XCircle, 
        iconColor: 'text-red-600' 
      },
      cancelled: { 
        className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200', 
        icon: XCircle, 
        iconColor: 'text-gray-600' 
      }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge className={`flex items-center gap-1 text-xs transition-colors ${config.className}`}>
        <Icon className={`h-3 w-3 ${config.iconColor}`} />
        {status}
      </Badge>
    )
  }

  const getProviderBadge = (provider: string) => {
    const colors = {
      mollie: 'bg-blue-100 text-blue-800 border-blue-200',
      stripe: 'bg-purple-100 text-purple-800 border-purple-200',
      paypal: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }

    return (
      <Badge className={`text-xs ${colors[provider as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {provider}
      </Badge>
    )
  }

  return (
    <RoleGuard allowedRoles={['user']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Mes clients</h1>
            <p className="text-muted-foreground">
              Consultez vos clients affiliés et leurs abonnements
            </p>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Rechercher des clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Rechercher par nom, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Rechercher
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mes clients ({pagination.total})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun client trouvé</h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Aucun client ne correspond à votre recherche.' : 'Vous n\'avez pas encore de clients affiliés.'}
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Abonnement</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Créé le</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {customer.firstName} {customer.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {customer.phonePrefix} {customer.phoneNumber}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{customer.email}</TableCell>
                        <TableCell>
                          {getSubscriptionBadge(customer.subscription || null)}
                          {customer.subscription && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {customer.subscription.planPrice}/{customer.subscription.planPeriod}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1">
                              {customer.isActive ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                              )}
                              <span className="text-sm">
                                {customer.isActive ? 'Actif' : 'Inactif'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {customer.isVerified ? (
                                <CheckCircle className="h-4 w-4 text-blue-500" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                              )}
                              <span className="text-sm">
                                {customer.isVerified ? 'Vérifié' : 'Non vérifié'}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatDate(customer.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const payments = await fetchCustomerPayments(customer._id)
                              setSelectedUser({
                                ...customer,
                                subscription: customer.subscription ? {
                                  ...customer.subscription,
                                  payments
                                } : null
                              })
                              setIsDetailDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir détails
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Affichage de {((pagination.page - 1) * pagination.limit) + 1} à{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} sur{' '}
                    {pagination.total} clients
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchCustomers(pagination.page - 1, searchTerm)}
                      disabled={!pagination.hasPrev}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchCustomers(pagination.page + 1, searchTerm)}
                      disabled={!pagination.hasNext}
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Customer Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails du client</DialogTitle>
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
                          {selectedUser.role === 'customer' ? 'Client' : selectedUser.role}
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
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Renouvellement automatique</Label>
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedUser.subscription.autoRenew ? 'Activé' : 'Désactivé'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Statut</Label>
                        <div className="mt-1">
                          {getSubscriptionBadge(selectedUser.subscription)}
                        </div>
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div className="border-t pt-4 mt-6">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Paiements Associés
                        {selectedUser.subscription.payments && selectedUser.subscription.payments.length > 0 && (
                          <Badge variant="outline" className="ml-2">
                            {selectedUser.subscription.payments.length}
                          </Badge>
                        )}
                      </h4>
                      
                      {loadingPayments ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : selectedUser.subscription.payments && selectedUser.subscription.payments.length > 0 ? (
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {selectedUser.subscription.payments.map((payment) => (
                            <div key={payment.id} className="border rounded-lg p-3 bg-gray-50">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {getPaymentStatusBadge(payment.status)}
                                  {getProviderBadge(payment.provider)}
                                </div>
                                <div className="text-sm font-medium">
                                  {payment.amount.value.toLocaleString()} {payment.amount.currency}
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                <div>
                                  <span className="font-medium">ID:</span> {payment.externalId}
                                </div>
                                <div>
                                  <span className="font-medium">Méthode:</span> {payment.method || 'N/A'}
                                </div>
                                <div>
                                  <span className="font-medium">Créé:</span> {formatDate(payment.createdAt)}
                                </div>
                                <div>
                                  <span className="font-medium">Payé:</span> {payment.paidAt ? formatDate(payment.paidAt) : 'N/A'}
                                </div>
                              </div>
                              
                              {payment.description && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  <span className="font-medium">Description:</span> {payment.description}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Aucun paiement trouvé pour ce client</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="border-t pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Client depuis</Label>
                      <p className="text-sm text-gray-900 mt-1">
                        {formatDate(selectedUser.createdAt)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Dernière modification</Label>
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
    </RoleGuard>
  )
} 