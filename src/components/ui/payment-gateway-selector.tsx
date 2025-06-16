'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2, CreditCard, Zap } from 'lucide-react'

interface PaymentGateway {
  id: string
  provider: string
  displayName: string
  description: string
  supportedCurrencies: string[]
  fees: {
    fixedFee: number
    percentageFee: number
    currency: string
  }
  limits: {
    minAmount: number
    maxAmount: number
    currency: string
  }
  priority: number
  isRecommended: boolean
}

interface PaymentGatewaySelectorProps {
  value?: string
  onValueChange: (provider: string) => void
  label?: string
  placeholder?: string
  showDescription?: boolean
  showFees?: boolean
  className?: string
}

export function PaymentGatewaySelector({
  value,
  onValueChange,
  label = "Passerelle de paiement",
  placeholder = "Choisir une passerelle",
  showDescription = true,
  showFees = true,
  className = ""
}: PaymentGatewaySelectorProps) {
  const [availableGateways, setAvailableGateways] = useState<PaymentGateway[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGateways = async () => {
      try {
        const response = await fetch('/api/payments/gateways')
        const data = await response.json()
        
        if (data.success) {
          setAvailableGateways(data.gateways)
          // Auto-select first gateway if only one available and no value set
          if (data.gateways.length === 1 && !value) {
            onValueChange(data.gateways[0].provider)
          }
        } else {
          setError('Erreur lors du chargement des passerelles')
        }
      } catch (err) {
        setError('Erreur de connexion')
        console.error('Error fetching gateways:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchGateways()
  }, [value, onValueChange])

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'mollie':
        return <CreditCard className="h-4 w-4 text-blue-600" />
      case 'stripe':
        return <Zap className="h-4 w-4 text-purple-600" />
      case 'paypal':
        return <CreditCard className="h-4 w-4 text-blue-500" />
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label>{label}</Label>
        <div className="flex items-center justify-center py-8 border rounded-md">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Chargement des passerelles...</span>
        </div>
      </div>
    )
  }

  if (error || availableGateways.length === 0) {
    return (
      <div className={`space-y-2 ${className}`}>
        <Label>{label}</Label>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            {error || 'Aucune passerelle de paiement active trouvée.'}
          </p>
        </div>
      </div>
    )
  }

  const selectedGateway = availableGateways.find(g => g.provider === value)

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="payment-gateway">{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id="payment-gateway">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {availableGateways.map((gateway) => (
            <SelectItem key={gateway.id} value={gateway.provider}>
              <div className="flex items-center gap-3 w-full">
                {getProviderIcon(gateway.provider)}
                <div className="flex flex-col flex-1">
                  <span className="font-medium">{gateway.displayName}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{gateway.provider.toUpperCase()}</span>
                    {showFees && (
                      <>
                        <span>•</span>
                        <span>Frais: {gateway.fees.percentageFee}%</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {showDescription && selectedGateway && (
        <p className="text-sm text-muted-foreground">
          {selectedGateway.description}
        </p>
      )}
      
      {selectedGateway && (
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center justify-between">
            <span>Montant min/max:</span>
            <span>
              {selectedGateway.limits.minAmount}€ - {selectedGateway.limits.maxAmount}€
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Devises supportées:</span>
            <span>{selectedGateway.supportedCurrencies.join(', ')}</span>
          </div>
        </div>
      )}
    </div>
  )
} 