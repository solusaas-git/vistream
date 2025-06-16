'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  CreditCard,
  User,
  Calendar,
  Globe,
  Hash,
  Receipt,
  Webhook,
  Database
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface PaymentDetails {
  id: string
  provider: string
  status: string
  amount: {
    value: number
    currency: string
  }
  description: string
  metadata?: any
  createdAt: string
  expiresAt?: string
  paidAt?: string
  redirectUrl?: string
  webhookUrl?: string
  checkoutUrl?: string
  paymentIntentId?: string
  customerId?: string
  note?: string
}

export default function PaymentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const resolvedParams = use(params)
  const [payment, setPayment] = useState<PaymentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const fetchPaymentDetails = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/admin/payments/${resolvedParams.id}`)
      const data = await response.json()

      if (data.success) {
        setPayment(data.data.payment)
      } else {
        setError(data.error || 'Paiement non trouvé')
      }
    } catch (error) {
      console.error('Error fetching payment details:', error)
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }, [resolvedParams.id])

  useEffect(() => {
    fetchPaymentDetails()
  }, [fetchPaymentDetails])

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
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
      <Badge className={`flex items-center gap-2 text-sm px-3 py-1 transition-colors ${config.className}`}>
        <Icon className={`h-4 w-4 ${config.iconColor}`} />
        {status.charAt(0).toUpperCase() + status.slice(1)}
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
      <Badge className={`text-sm px-3 py-1 transition-colors ${colors[provider as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'}`}>
        {provider.charAt(0).toUpperCase() + provider.slice(1)}
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
    return format(new Date(dateString), 'dd MMMM yyyy à HH:mm', { locale: fr })
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Chargement des détails du paiement...</span>
        </div>
      </div>
    )
  }

  if (error || !payment) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Paiement non trouvé'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Détails du Paiement</h1>
            <p className="text-muted-foreground">
              ID: {payment.id}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPaymentDetails} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          {payment.checkoutUrl && (
            <Button variant="outline" asChild>
              <a href={payment.checkoutUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Voir le checkout
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Status Alert */}
      {payment.note && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{payment.note}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Payment Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Informations Générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Statut</label>
                  <div className="mt-1">
                    {getStatusBadge(payment.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fournisseur</label>
                  <div className="mt-1">
                    {getProviderBadge(payment.provider)}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Montant</label>
                <div className="text-2xl font-bold text-green-600 mt-1">
                  {formatAmount(payment.amount)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="mt-1">{payment.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date de création</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(payment.createdAt)}</span>
                  </div>
                </div>
                {payment.paidAt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date de paiement</label>
                    <div className="flex items-center gap-2 mt-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>{formatDate(payment.paidAt)}</span>
                    </div>
                  </div>
                )}
              </div>

              {payment.expiresAt && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date d'expiration</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span>{formatDate(payment.expiresAt)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Détails Techniques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">ID de paiement</label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                    {payment.id}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(payment.id, 'ID')}
                  >
                    {copied === 'ID' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {payment.paymentIntentId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment Intent ID</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                      {payment.paymentIntentId}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(payment.paymentIntentId!, 'Intent')}
                    >
                      {copied === 'Intent' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {payment.customerId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Customer ID</label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                      {payment.customerId}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(payment.customerId!, 'Customer')}
                    >
                      {copied === 'Customer' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {payment.redirectUrl && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">URL de redirection</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono flex-1 truncate">
                      {payment.redirectUrl}
                    </code>
                  </div>
                </div>
              )}

              {payment.webhookUrl && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">URL de webhook</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Webhook className="h-4 w-4 text-muted-foreground" />
                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono flex-1 truncate">
                      {payment.webhookUrl}
                    </code>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          {payment.metadata && Object.keys(payment.metadata).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Métadonnées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(payment.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-start">
                      <span className="text-sm font-medium text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className="text-sm text-right max-w-[60%] break-words">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={fetchPaymentDetails}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Synchroniser avec {payment.provider}
              </Button>
              
              {payment.checkoutUrl && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href={payment.checkoutUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ouvrir le checkout
                  </a>
                </Button>
              )}
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => copyToClipboard(payment.id, 'Payment ID')}
              >
                {copied === 'Payment ID' ? (
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Copier l'ID
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 