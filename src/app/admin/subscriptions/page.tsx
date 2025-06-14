'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { 
  CreditCard, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  DollarSign,
  Users,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Crown,
  Shield,
  User
} from 'lucide-react'

interface Subscription {
  _id: string
  userId: string
  user?: {
    firstName: string
    lastName: string
    email: string
    role: 'admin' | 'user' | 'customer'
  }
  plan: 'starter' | 'standard' | 'pro'
  status: 'active' | 'inactive' | 'cancelled' | 'expired'
  startDate: string
  endDate: string
  price: number
  currency: string
  paymentMethod: string
  autoRenew: boolean
  // Affiliation data
  affiliationCode?: string
  affiliatedUserId?: string
  affiliatedUser?: {
    firstName: string
    lastName: string
    email: string
    affiliationCode: string
  }
  saleValue: number
  createdAt: string
  updatedAt: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

const createSubscriptionSchema = z.object({
  userId: z.string().min(1, "L'utilisateur est requis."),
  plan: z.enum(['starter', 'standard', 'pro']),
  status: z.enum(['active', 'inactive', 'cancelled', 'expired']),
  startDate: z.string().min(1, "La date de début est requise."),
  endDate: z.string().min(1, "La date de fin est requise."),
  price: z.number().min(0, "Le prix doit être positif."),
  currency: z.string().default('EUR'),
  paymentMethod: z.string().min(1, "La méthode de paiement est requise."),
  autoRenew: z.boolean(),
})

type CreateSubscriptionFormValues = z.infer<typeof createSubscriptionSchema>

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
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
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    revenue: 0,
    avgPrice: 0
  })

  const form = useForm<CreateSubscriptionFormValues>({
    resolver: zodResolver(createSubscriptionSchema),
    defaultValues: {
      userId: '',
      plan: 'starter',
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      price: 15,
      currency: 'EUR',
      paymentMethod: 'stripe',
      autoRenew: true,
    },
  })

  const fetchSubscriptions = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      })

      if (searchTerm) params.append('search', searchTerm)
      if (planFilter && planFilter !== 'all') params.append('plan', planFilter)
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/admin/subscriptions?${params}`)
      const data = await response.json()

      if (data.success) {
        setSubscriptions(data.data.subscriptions || [])
        setPagination(data.data.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        })
        setStats(data.data.stats || {
          total: 0,
          active: 0,
          revenue: 0,
          avgPrice: 0
        })
      } else {
        console.error('Error fetching subscriptions:', data.error)
        // Set empty state on error
        setSubscriptions([])
        setPagination({
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        })
        setStats({
          total: 0,
          active: 0,
          revenue: 0,
          avgPrice: 0
        })
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error)
      // Set empty state on error
      setSubscriptions([])
      setPagination({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      })
      setStats({
        total: 0,
        active: 0,
        revenue: 0,
        avgPrice: 0
      })
    } finally {
      setLoading(false)
    }
  }, [searchTerm, planFilter, statusFilter, pagination.limit])

  useEffect(() => {
    fetchSubscriptions()
  }, [fetchSubscriptions])

  const handleCreateSubscription = async (data: CreateSubscriptionFormValues) => {
    try {
      setIsSubmitting(true)
      const response = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        setIsCreateDialogOpen(false)
        form.reset()
        fetchSubscriptions(pagination.page)
        alert('Abonnement créé avec succès!')
      } else {
        alert(result.error || 'Erreur lors de la création de l\'abonnement')
      }
    } catch (error) {
      console.error('Error creating subscription:', error)
      alert('Erreur lors de la création de l\'abonnement')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSubscription = async (subscriptionId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet abonnement ?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        fetchSubscriptions(pagination.page)
        alert('Abonnement supprimé avec succès!')
      } else {
        alert(result.error || 'Erreur lors de la suppression de l\'abonnement')
      }
    } catch (error) {
      console.error('Error deleting subscription:', error)
      alert('Erreur lors de la suppression de l\'abonnement')
    }
  }

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'pro':
        return <Crown className="h-4 w-4" />
      case 'standard':
        return <Shield className="h-4 w-4" />
      case 'starter':
        return <User className="h-4 w-4" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'pro':
        return 'bg-purple-100 text-purple-800'
      case 'standard':
        return 'bg-blue-100 text-blue-800'
      case 'starter':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'expired':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CreditCard className="h-8 w-8" />
            Gestion des Abonnements
          </h1>
          <p className="text-muted-foreground mt-2">
            Gérez les abonnements, les plans et les paiements
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel Abonnement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Créer un Nouvel Abonnement
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateSubscription)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Utilisateur</FormLabel>
                      <FormControl>
                        <Input placeholder="64f8a1b2c3d4e5f6g7h8i9j0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="plan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un plan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="starter">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Starter
                              </div>
                            </SelectItem>
                            <SelectItem value="standard">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Standard
                              </div>
                            </SelectItem>
                            <SelectItem value="pro">
                              <div className="flex items-center gap-2">
                                <Crown className="h-4 w-4" />
                                Pro
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statut</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un statut" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Actif</SelectItem>
                            <SelectItem value="inactive">Inactif</SelectItem>
                            <SelectItem value="cancelled">Annulé</SelectItem>
                            <SelectItem value="expired">Expiré</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de début</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date de fin</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prix</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Devise</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Méthode de paiement</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="stripe">Stripe</SelectItem>
                            <SelectItem value="paypal">PayPal</SelectItem>
                            <SelectItem value="bank_transfer">Virement</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="autoRenew"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Renouvellement automatique</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          L'abonnement se renouvelle automatiquement
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Création...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Créer l'abonnement
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Abonnements</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Abonnements Actifs</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenus Totaux</p>
                <p className="text-2xl font-bold">{formatPrice(stats.revenue, 'EUR')}</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prix Moyen</p>
                <p className="text-2xl font-bold">{formatPrice(stats.avgPrice, 'EUR')}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher par email utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrer par plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les plans</SelectItem>
                <SelectItem value="starter">Starter</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
                <SelectItem value="expired">Expiré</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Abonnements ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead>Affilié</TableHead>
                    <TableHead>Renouvellement</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((subscription) => (
                    <TableRow key={subscription._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {subscription.user ? 
                              `${subscription.user.firstName} ${subscription.user.lastName}` : 
                              'Utilisateur inconnu'
                            }
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {subscription.user?.email || subscription.userId}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPlanBadgeColor(subscription.plan)}>
                          <div className="flex items-center gap-1">
                            {getPlanIcon(subscription.plan)}
                            {subscription.plan}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(subscription.status)}>
                          {subscription.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatPrice(subscription.price, subscription.currency)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(subscription.startDate)}</div>
                          <div className="text-muted-foreground">
                            → {formatDate(subscription.endDate)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {subscription.affiliatedUser ? (
                          <div>
                            <div className="font-medium text-sm">
                              {subscription.affiliatedUser.firstName} {subscription.affiliatedUser.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Code: {subscription.affiliationCode}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Vente directe</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {subscription.autoRenew ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">
                            {subscription.autoRenew ? 'Oui' : 'Non'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSubscription(subscription)
                              setIsDetailDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSubscription(subscription._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
                  {pagination.total} abonnements
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchSubscriptions(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchSubscriptions(pagination.page + 1)}
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

      {/* Subscription Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Détails de l'Abonnement
            </DialogTitle>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Utilisateur</Label>
                  <p className="text-sm">
                    {selectedSubscription.user ? 
                      `${selectedSubscription.user.firstName} ${selectedSubscription.user.lastName}` : 
                      'Utilisateur inconnu'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedSubscription.user?.email || selectedSubscription.userId}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Plan</Label>
                  <Badge className={getPlanBadgeColor(selectedSubscription.plan)}>
                    <div className="flex items-center gap-1">
                      {getPlanIcon(selectedSubscription.plan)}
                      {selectedSubscription.plan}
                    </div>
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Statut</Label>
                  <Badge className={getStatusBadgeColor(selectedSubscription.status)}>
                    {selectedSubscription.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Prix</Label>
                  <p className="text-sm">{formatPrice(selectedSubscription.price, selectedSubscription.currency)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Date de début</Label>
                  <p className="text-sm">{formatDate(selectedSubscription.startDate)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Date de fin</Label>
                  <p className="text-sm">{formatDate(selectedSubscription.endDate)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Méthode de paiement</Label>
                  <p className="text-sm">{selectedSubscription.paymentMethod}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Renouvellement automatique</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedSubscription.autoRenew ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      {selectedSubscription.autoRenew ? 'Activé' : 'Désactivé'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Informations d'affiliation */}
              {selectedSubscription.affiliatedUser && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Informations d'Affiliation
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Affilié</Label>
                      <p className="text-sm">
                        {selectedSubscription.affiliatedUser.firstName} {selectedSubscription.affiliatedUser.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedSubscription.affiliatedUser.email}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Code d'affiliation</Label>
                      <Badge variant="outline" className="font-mono">
                        {selectedSubscription.affiliationCode}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Label className="text-sm font-medium text-muted-foreground">Valeur de la vente</Label>
                    <p className="text-sm font-bold text-green-600">
                      {selectedSubscription.saleValue?.toLocaleString() || 0}€
                    </p>
                  </div>
                </div>
              )}
              
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Créé le</Label>
                    <p className="text-sm">{formatDate(selectedSubscription.createdAt)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Modifié le</Label>
                    <p className="text-sm">{formatDate(selectedSubscription.updatedAt)}</p>
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