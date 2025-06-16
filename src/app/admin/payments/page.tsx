'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  CreditCard, 
  TrendingUp, 
  Users, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Euro
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

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
  expiresAt?: string
  webhookProcessedAt?: string
  webhookAttempts?: number
  isProcessed?: boolean
  user?: {
    id: string
    email: string
    name: string
    role: string
  }
  metadata?: any
}

interface Analytics {
  totalRevenue: number
  totalPayments: number
  recentPayments: number
  statusDistribution: Record<string, number>
  providerDistribution: Record<string, number>
}

interface PaymentData {
  payments: Payment[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    limit: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  analytics?: Analytics
}

export default function AdminPaymentsPage() {
  const router = useRouter()
  const [data, setData] = useState<PaymentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [provider, setProvider] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [includeAnalytics, setIncludeAnalytics] = useState(true)

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        includeAnalytics: includeAnalytics.toString()
      })

      if (search) params.append('search', search)
      if (status) params.append('status', status)
      if (provider) params.append('provider', provider)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/admin/payments?${params}`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error || 'Erreur lors du chargement des paiements')
      }
    } catch (err) {
      console.error('Error fetching payments:', err)
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }, [currentPage, status, provider, startDate, endDate, includeAnalytics, search])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  const handleSearch = () => {
    setCurrentPage(1)
    fetchPayments()
  }

  const handleReset = () => {
    setSearch('')
    setStatus('')
    setProvider('')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
    fetchPayments()
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { 
        className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200', 
        icon: CheckCircle, 
        iconColor: 'text-green-600' 
      },
      pending: { 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200', 
        icon: Clock, 
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
      },
      expired: { 
        className: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200', 
        icon: AlertCircle, 
        iconColor: 'text-orange-600' 
      }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge className={`flex items-center gap-1 transition-colors ${config.className}`}>
        <Icon className={`h-3 w-3 ${config.iconColor}`} />
        {status}
      </Badge>
    )
  }

  const getProviderBadge = (provider: string) => {
    const colors = {
      mollie: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
      stripe: 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
      paypal: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200'
    }

    return (
      <Badge className={`transition-colors ${colors[provider as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'}`}>
        {provider}
      </Badge>
    )
  }

  const formatAmount = (amount: { value: number; currency: string }) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: amount.currency
    }).format(amount.value)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: fr })
  }

  if (loading && !data) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Chargement des paiements...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Paiements</h1>
          <p className="text-muted-foreground">
            Gérez et surveillez tous les paiements de la plateforme
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPayments} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {data?.analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus Total</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: 'EUR'
                }).format(data.analytics.totalRevenue)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paiements</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.analytics.totalPayments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dernières 24h</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.analytics.recentPayments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de Succès</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.analytics.totalPayments > 0 
                  ? Math.round((data.analytics.statusDistribution.completed || 0) / data.analytics.totalPayments * 100)
                  : 0}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <Input
                placeholder="Rechercher par email, nom, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            <Select value={status || 'all'} onValueChange={(value) => setStatus(value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="completed">Complété</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="failed">Échoué</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
                <SelectItem value="expired">Expiré</SelectItem>
              </SelectContent>
            </Select>

            <Select value={provider || 'all'} onValueChange={(value) => setProvider(value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Fournisseur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les fournisseurs</SelectItem>
                <SelectItem value="mollie">Mollie</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Date début"
            />

            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="Date fin"
            />
          </div>

          <div className="flex gap-2 mt-4">
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Rechercher
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Réinitialiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Paiements</CardTitle>
          <CardDescription>
            {data?.pagination.totalCount || 0} paiement(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-sm">
                      {payment.externalId.substring(0, 12)}...
                    </TableCell>
                    <TableCell>
                      {payment.user ? (
                        <div>
                          <div className="font-medium">{payment.user.name}</div>
                          <div className="text-sm text-muted-foreground">{payment.user.email}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Utilisateur inconnu</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatAmount(payment.amount)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.status)}
                    </TableCell>
                    <TableCell>
                      {getProviderBadge(payment.provider)}
                    </TableCell>
                    <TableCell>
                      {payment.method || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatDate(payment.createdAt)}</div>
                        {payment.paidAt && (
                          <div className="text-muted-foreground">
                            Payé: {formatDate(payment.paidAt)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => router.push(`/admin/payments/${payment.externalId}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {data.pagination.currentPage} sur {data.pagination.totalPages}
                ({data.pagination.totalCount} résultats)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!data.pagination.hasPrevPage || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!data.pagination.hasNextPage || loading}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 