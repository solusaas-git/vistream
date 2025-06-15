'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CreditCard, Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function TestPaymentPage() {
  const [amount, setAmount] = useState('10.00')
  const [description, setDescription] = useState('Test Payment')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCreatePayment = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)

      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency: 'EUR',
          description,
          redirectUrl: `${window.location.origin}/test-payment/success`,
          webhookUrl: `${window.location.origin}/api/webhooks/mollie`,
          metadata: {
            testPayment: true,
            createdFrom: 'test-page'
          }
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResult(data.payment)
        // Redirect to Mollie checkout
        window.location.href = data.payment.checkoutUrl
      } else {
        setError(data.error || 'Erreur lors de la création du paiement')
      }
    } catch (err) {
      setError('Erreur de connexion')
      console.error('Payment creation error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test Mollie Payment
          </h1>
          <p className="text-gray-600">
            Testez l'intégration Mollie avec des paiements de démonstration
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Créer un paiement test
            </CardTitle>
            <CardDescription>
              Utilisez cette page pour tester l'intégration Mollie. Les paiements seront traités en mode test.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Montant (EUR)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="10.00"
                />
              </div>
              <div>
                <Label htmlFor="currency">Devise</Label>
                <Input
                  id="currency"
                  value="EUR"
                  disabled
                  className="bg-gray-100"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description du paiement"
                rows={3}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-red-800">
                  <XCircle className="h-4 w-4" />
                  <span className="font-medium">Erreur</span>
                </div>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            )}

            {result && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Paiement créé avec succès</span>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>ID:</strong> {result.id}</p>
                  <p><strong>Statut:</strong> {result.status}</p>
                  <p><strong>Montant:</strong> {result.amount.currency} {result.amount.value}</p>
                </div>
              </div>
            )}

            <Button 
              onClick={handleCreatePayment}
              disabled={loading || !amount || !description}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Créer le paiement
                </>
              )}
            </Button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
              <h4 className="font-medium text-blue-900 mb-2">Informations de test :</h4>
              <ul className="text-blue-800 space-y-1">
                <li>• Les paiements sont traités en mode test Mollie</li>
                <li>• Utilisez les cartes de test Mollie pour simuler des paiements</li>
                <li>• Les webhooks seront envoyés à votre endpoint local</li>
                <li>• Vérifiez les logs de la console pour le suivi</li>
              </ul>
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