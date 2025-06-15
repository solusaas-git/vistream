'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2, XCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'failed' | 'pending'>('loading')
  const [paymentData, setPaymentData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkPaymentStatus = async () => {
      // Get payment ID from URL parameters (Mollie redirects with payment ID)
      const paymentId = searchParams.get('payment_id') || searchParams.get('id')
      
      if (!paymentId) {
        setError('Aucun ID de paiement trouvé')
        setPaymentStatus('failed')
        return
      }

      try {
        const response = await fetch(`/api/payments/${paymentId}`)
        const data = await response.json()

        if (data.success) {
          setPaymentData(data.payment)
          
          switch (data.payment.status) {
            case 'paid':
              setPaymentStatus('success')
              break
            case 'pending':
            case 'open':
              setPaymentStatus('pending')
              break
            default:
              setPaymentStatus('failed')
          }
        } else {
          setError(data.error || 'Erreur lors de la vérification du paiement')
          setPaymentStatus('failed')
        }
      } catch (err) {
        setError('Erreur de connexion')
        setPaymentStatus('failed')
      }
    }

    checkPaymentStatus()
  }, [searchParams])

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'loading':
        return <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />
      case 'pending':
        return <Loader2 className="h-12 w-12 text-yellow-500" />
      case 'failed':
        return <XCircle className="h-12 w-12 text-red-500" />
    }
  }

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'loading':
        return {
          title: 'Vérification du paiement...',
          description: 'Nous vérifions le statut de votre paiement.'
        }
      case 'success':
        return {
          title: 'Paiement réussi !',
          description: 'Votre paiement a été traité avec succès.'
        }
      case 'pending':
        return {
          title: 'Paiement en cours',
          description: 'Votre paiement est en cours de traitement.'
        }
      case 'failed':
        return {
          title: 'Paiement échoué',
          description: error || 'Une erreur est survenue lors du traitement de votre paiement.'
        }
    }
  }

  const statusMessage = getStatusMessage()

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            <CardTitle className="text-2xl">
              {statusMessage.title}
            </CardTitle>
            <CardDescription className="text-lg">
              {statusMessage.description}
            </CardDescription>
          </CardHeader>
          
          {paymentData && (
            <CardContent className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Détails du paiement</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">ID de paiement:</span>
                    <p className="font-mono">{paymentData.id}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Statut:</span>
                    <p className="capitalize">{paymentData.status}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Montant:</span>
                    <p>{paymentData.amount.currency} {paymentData.amount.value}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Description:</span>
                    <p>{paymentData.description}</p>
                  </div>
                  {paymentData.createdAt && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Date de création:</span>
                      <p>{new Date(paymentData.createdAt).toLocaleString('fr-FR')}</p>
                    </div>
                  )}
                </div>
              </div>

              {paymentStatus === 'pending' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 mb-2">Paiement en attente</h4>
                  <p className="text-yellow-800 text-sm">
                    Votre paiement est en cours de traitement. Vous recevrez une confirmation par email une fois le paiement finalisé.
                  </p>
                </div>
              )}

              {paymentStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">Paiement confirmé</h4>
                  <p className="text-green-800 text-sm">
                    Merci pour votre paiement ! Vous devriez recevoir un email de confirmation sous peu.
                  </p>
                </div>
              )}

              {paymentStatus === 'failed' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">Paiement non abouti</h4>
                  <p className="text-red-800 text-sm">
                    Le paiement n'a pas pu être traité. Vous pouvez réessayer ou contacter le support si le problème persiste.
                  </p>
                </div>
              )}
            </CardContent>
          )}

          <CardContent className="pt-0">
            <div className="flex gap-4">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/test-payment">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Nouveau test
                </Link>
              </Button>
              
              {paymentStatus === 'failed' && (
                <Button asChild className="flex-1">
                  <Link href="/test-payment">
                    Réessayer
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Cette page est uniquement pour les tests de développement.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              </div>
              <CardTitle className="text-2xl">Chargement...</CardTitle>
              <CardDescription className="text-lg">
                Vérification du statut du paiement...
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
} 