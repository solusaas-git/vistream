'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Eye, EyeOff, UserPlus, Mail, Lock, User, Loader2, Phone, ChevronDown, Star, Check, Crown, Shield, Hash, CreditCard, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UnifiedPaymentForm } from '@/components/ui/unified-payment-form'

// Payment Gateway Interface
interface PaymentGateway {
  id: string
  provider: string
  displayName: string
  description: string
  supportedCurrencies: string[]
  supportedPaymentMethods: string[]
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

// Payment Method Selector Component
interface PaymentMethodSelectorProps {
  amount: number
  currency: string
  description: string
  customerEmail?: string
  customerName?: string
  metadata?: Record<string, any>
  onSuccess: (result: any) => void
  onError: (error: string) => void
}

function PaymentMethodSelector({
  amount,
  currency,
  description,
  customerEmail,
  customerName,
  metadata,
  onSuccess,
  onError
}: PaymentMethodSelectorProps) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
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
        } else {
          setError('Erreur lors du chargement des méthodes de paiement')
        }
      } catch (err) {
        setError('Erreur de connexion')
        console.error('Error fetching gateways:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchGateways()
  }, [])

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'mollie':
        return <CreditCard className="h-6 w-6 text-blue-600" />
      case 'stripe':
        return <CreditCard className="h-6 w-6 text-purple-600" />
      case 'paypal':
        return <CreditCard className="h-6 w-6 text-blue-500" />
      default:
        return <CreditCard className="h-6 w-6 text-gray-600" />
    }
  }

  const getProviderBadge = (gateway: PaymentGateway) => {
    if (gateway.isRecommended) {
      return { text: 'Recommandé', className: 'bg-green-100 text-green-700' }
    }
    return { text: 'Autres options', className: 'bg-blue-100 text-blue-700' }
  }

  const getProviderDetails = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'stripe':
        return {
          subtitle: 'Paiement intégré et sécurisé - Pas de redirection',
          methods: 'Visa, Mastercard, etc.',
          timing: 'Immédiat'
        }
      case 'mollie':
        return {
          subtitle: 'Bancontact, iDEAL, PayPal, Virement',
          methods: 'Méthodes européennes',
          timing: 'Redirection'
        }
      case 'paypal':
        return {
          subtitle: 'Paiement via votre compte PayPal',
          methods: 'PayPal, cartes',
          timing: 'Redirection'
        }
      default:
        return {
          subtitle: 'Méthode de paiement sécurisée',
          methods: 'Divers',
          timing: 'Variable'
        }
    }
  }

  if (selectedProvider) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => setSelectedProvider(null)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Changer de méthode
        </Button>
        
        <UnifiedPaymentForm
          provider={selectedProvider}
          amount={amount}
          currency={currency}
          description={description}
          customerEmail={customerEmail}
          customerName={customerName}
          metadata={metadata}
          onSuccess={onSuccess}
          onError={onError}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">Choisissez votre méthode de paiement</h3>
          <p className="text-sm text-muted-foreground">
            Chargement des méthodes disponibles...
          </p>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">Chargement...</span>
        </div>
      </div>
    )
  }

  if (error || availableGateways.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">Méthodes de paiement</h3>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            {error || 'Aucune méthode de paiement disponible pour le moment.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Choisissez votre méthode de paiement</h3>
        <p className="text-sm text-muted-foreground">
          Sélectionnez la méthode qui vous convient le mieux
        </p>
      </div>

      <div className="grid gap-4">
        {availableGateways.map((gateway) => {
          const badge = getProviderBadge(gateway)
          const details = getProviderDetails(gateway.provider)
          
          return (
            <Card 
              key={gateway.id}
              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50"
              onClick={() => setSelectedProvider(gateway.provider)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-100 rounded-full">
                      {getProviderIcon(gateway.provider)}
                    </div>
                    <div>
                      <h4 className="font-semibold">{gateway.displayName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {gateway.description || details.subtitle}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded ${badge.className}`}>
                          {badge.text}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {details.methods}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{amount}€</div>
                    <div className="text-xs text-muted-foreground">{details.timing}</div>
                    {gateway.fees.percentageFee > 0 && (
                      <div className="text-xs text-muted-foreground">
                        +{gateway.fees.percentageFee}% frais
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="text-xs text-muted-foreground text-center mt-4">
        Tous les paiements sont sécurisés et cryptés
      </div>

      {/* Security and Payment Cards Section */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="text-center space-y-4">
          {/* Security Badges */}
          <div className="flex flex-col items-center space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Paiement 100% sécurisé</h4>
            <div className="flex items-center justify-center space-x-4">
              <Image
                src="/logos/security/sectigo-ssl.png"
                alt="SSL Secure"
                width={82}
                height={32}
                className="h-8 w-auto"
              />
              <Image
                src="/logos/security/ssl-secure-badge.png"
                alt="SSL Certificate"
                width={167}
                height={42}
                className="h-8 w-auto"
              />
              <Image
                src="/logos/security/sectigo-secure.png"
                alt="Trusted Security"
                width={106}
                height={42}
                className="h-8 w-auto"
              />
            </div>
          </div>

          {/* Payment Cards */}
          <div className="flex flex-col items-center space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Cartes acceptées</h4>
            <div className="flex items-center justify-center space-x-3">
              <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <Image
                  src="/logos/payment/visa.svg"
                  alt="Visa"
                  width={80}
                  height={28}
                  className="h-7 w-auto"
                />
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <Image
                  src="/logos/payment/mastercard.svg"
                  alt="Mastercard"
                  width={80}
                  height={28}
                  className="h-7 w-auto"
                />
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <Image
                  src="/logos/payment/amex.svg"
                  alt="American Express"
                  width={80}
                  height={28}
                  className="h-7 w-auto"
                />
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <Image
                  src="/logos/payment/paypal.svg"
                  alt="PayPal"
                  width={80}
                  height={28}
                  className="h-7 w-auto"
                />
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <Image
                  src="/logos/payment/apple-pay.svg"
                  alt="Apple Pay"
                  width={80}
                  height={28}
                  className="h-7 w-auto"
                />
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                <Image
                  src="/logos/payment/google-pay.svg"
                  alt="Google Pay"
                  width={80}
                  height={28}
                  className="h-7 w-auto"
                />
              </div>
            </div>
          </div>

          {/* Trust Message */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-3 max-w-2xl mx-auto shadow-sm">
            <div className="flex items-center justify-center space-x-2">
              <Shield className="h-5 w-5 text-green-600 flex-shrink-0" />
              <span className="text-sm font-semibold text-gray-800">
                🔒 Vos données sont protégées et ne sont jamais stockées sur nos serveurs
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const signupSchema = z.object({
  firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères.").max(50),
  lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères.").max(50),
  email: z.string().email("Adresse email invalide."),
  phonePrefix: z.string().min(1, "Le préfixe téléphonique est requis."),
  phoneNumber: z.string().min(8, "Le numéro de téléphone doit contenir au moins 8 chiffres.").max(15),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  confirmPassword: z.string(),
  selectedPlanId: z.string().min(1, "Vous devez sélectionner un plan."),
  affiliationCode: z.string().regex(/^\d{4}$/, "Le code d'affiliation doit contenir exactement 4 chiffres.").optional().or(z.literal("")),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas.",
  path: ["confirmPassword"],
})

type SignupFormValues = z.infer<typeof signupSchema>

interface SelectedPlan {
  id: string
  name: string
  description: string
  price: string
  period: string
  highlight: boolean
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
  slug: string
}

function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null)
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [signupStep, setSignupStep] = useState<'form' | 'payment' | 'success'>('form')
  const [createdUser, setCreatedUser] = useState<any>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()

  const countries = [
    { code: '+33', name: 'France', flag: '🇫🇷' },
    { code: '+32', name: 'Belgique', flag: '🇧🇪' },
    { code: '+31', name: 'Pays-Bas', flag: '🇳🇱' },
    { code: '+34', name: 'Espagne', flag: '🇪🇸' },
    { code: '+39', name: 'Italie', flag: '🇮🇹' },
    { code: '+40', name: 'Roumanie', flag: '🇷🇴' },
    { code: '+49', name: 'Allemagne', flag: '🇩🇪' },
    { code: '+41', name: 'Suisse', flag: '🇨🇭' },
    { code: '+351', name: 'Portugal', flag: '🇵🇹' },
    { code: '+44', name: 'Royaume-Uni', flag: '🇬🇧' },
    { code: '+1', name: 'États-Unis', flag: '🇺🇸' },
  ]

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phonePrefix: "+33",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      selectedPlanId: "",
      affiliationCode: "",
    },
  })

  // Load available plans
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setPlansLoading(true)
        const response = await fetch('/api/plans')
        const data = await response.json()

        if (data.success) {
          const activePlans = data.data.plans
            .filter((plan: Plan) => plan.isActive)
            .sort((a: Plan, b: Plan) => a.order - b.order)
          setAvailablePlans(activePlans)
        }
      } catch (error) {
        console.error('Error fetching plans:', error)
      } finally {
        setPlansLoading(false)
      }
    }

    fetchPlans()
  }, [])

  // Extract plan data from URL params and track marketing attribution
  useEffect(() => {
    // Nouveau format : plan (slug) au lieu de plan_id
    const planSlug = searchParams.get('plan')
    const planIdParam = searchParams.get('plan_id') // Ancien format pour compatibilité
    const planJsonParam = searchParams.get('plan') // Très ancien format JSON
    const affiliationCode = searchParams.get('affiliation') // Code d'affiliation depuis l'URL
    
    // Set affiliation code if provided in URL
    if (affiliationCode && /^\d{4}$/.test(affiliationCode)) {
      form.setValue('affiliationCode', affiliationCode)
    }
    
    if (planSlug && availablePlans.length > 0) {
      // Nouveau format : récupérer le plan depuis le slug
      const plan = availablePlans.find(p => p.slug === planSlug)
      if (plan) {
        const planData: SelectedPlan = {
          id: plan._id,
          name: plan.name,
          description: plan.description,
          price: plan.price,
          period: plan.period,
          highlight: plan.highlight
        }
        setSelectedPlan(planData)
        form.setValue('selectedPlanId', plan._id)
        
        // Track marketing attribution
        const trackingData = {
          planId: plan._id,
          planName: plan.name,
          planPrice: plan.price,
          planPeriod: plan.period,
          utm_source: searchParams.get('utm_source'),
          utm_medium: searchParams.get('utm_medium'),
          utm_campaign: searchParams.get('utm_campaign'),
          utm_content: searchParams.get('utm_content'),
          utm_term: searchParams.get('utm_term'),
          referrer: searchParams.get('referrer'),
          campaign_id: searchParams.get('campaign_id'),
          affiliate_id: searchParams.get('affiliate_id'),
          promo_code: searchParams.get('promo_code'),
          timestamp: searchParams.get('timestamp'),
          conversionType: 'signup_started'
        }
        
        // Send tracking data to API (non-blocking)
        fetch('/api/marketing/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(trackingData)
        }).catch(error => {
          console.warn('Marketing tracking failed:', error)
        })
      }
    } else if (planIdParam && availablePlans.length > 0) {
      // Format intermédiaire : plan_id
      const plan = availablePlans.find(p => p._id === planIdParam)
      if (plan) {
        const planData: SelectedPlan = {
          id: plan._id,
          name: plan.name,
          description: plan.description,
          price: plan.price,
          period: plan.period,
          highlight: plan.highlight
        }
        setSelectedPlan(planData)
        form.setValue('selectedPlanId', plan._id)
        
        // Track marketing attribution
        const trackingData = {
          planId: plan._id,
          planName: plan.name,
          planPrice: plan.price,
          planPeriod: plan.period,
          utm_source: searchParams.get('utm_source'),
          utm_medium: searchParams.get('utm_medium'),
          utm_campaign: searchParams.get('utm_campaign'),
          utm_content: searchParams.get('utm_content'),
          utm_term: searchParams.get('utm_term'),
          referrer: searchParams.get('referrer'),
          campaign_id: searchParams.get('campaign_id'),
          affiliate_id: searchParams.get('affiliate_id'),
          promo_code: searchParams.get('promo_code'),
          timestamp: searchParams.get('timestamp'),
          conversionType: 'signup_started'
        }
        
        // Send tracking data to API (non-blocking)
        fetch('/api/marketing/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(trackingData)
        }).catch(error => {
          console.warn('Marketing tracking failed:', error)
        })
      }
    } else if (planJsonParam && !planSlug) {
      // Très ancien format : plan JSON (pour compatibilité)
      try {
        const planData = JSON.parse(planJsonParam)
        setSelectedPlan(planData)
        form.setValue('selectedPlanId', planData.id)
        
        // Track marketing attribution
        const trackingData = {
          planId: planData.id,
          planName: planData.name,
          planPrice: planData.price,
          planPeriod: planData.period,
          utm_source: searchParams.get('utm_source'),
          utm_medium: searchParams.get('utm_medium'),
          utm_campaign: searchParams.get('utm_campaign'),
          utm_content: searchParams.get('utm_content'),
          utm_term: searchParams.get('utm_term'),
          referrer: searchParams.get('referrer'),
          campaign_id: searchParams.get('campaign_id'),
          affiliate_id: searchParams.get('affiliate_id'),
          promo_code: searchParams.get('promo_code'),
          timestamp: searchParams.get('timestamp'),
          conversionType: 'signup_started'
        }
        
        // Send tracking data to API (non-blocking)
        fetch('/api/marketing/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(trackingData)
        }).catch(error => {
          console.warn('Marketing tracking failed:', error)
        })
        
      } catch (error) {
        console.error('Error parsing plan data:', error)
      }
    }
  }, [searchParams, form, availablePlans])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false)
      }
    }

    if (showCountryDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCountryDropdown])

  const handlePlanSelection = (planId: string) => {
    const plan = availablePlans.find(p => p._id === planId)
    if (plan) {
      const planData: SelectedPlan = {
        id: plan._id,
        name: plan.name,
        description: plan.description,
        price: plan.price,
        period: plan.period,
        highlight: plan.highlight
      }
      setSelectedPlan(planData)
      form.setValue('selectedPlanId', planId)
    }
  }

  const getPlanIcon = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('pro') || lowerName.includes('enterprise')) {
      return <Crown className="h-4 w-4" />
    } else if (lowerName.includes('standard') || lowerName.includes('business')) {
      return <Shield className="h-4 w-4" />
    } else {
      return <User className="h-4 w-4" />
    }
  }

  async function onSubmit(data: SignupFormValues) {
    // Prevent multiple submissions
    if (isLoading) return
    
    setIsLoading(true)
    setPaymentError(null)
    
    try {
      const selectedPlanData = availablePlans.find(p => p._id === data.selectedPlanId)
      
      const requestData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phonePrefix: data.phonePrefix,
        phoneNumber: data.phoneNumber,
        password: data.password,
        confirmPassword: data.confirmPassword,
        affiliationCode: data.affiliationCode || '',
        selectedPlan: selectedPlanData ? {
          planId: selectedPlanData._id,
          planName: selectedPlanData.name,
          planPrice: selectedPlanData.price,
          planPeriod: selectedPlanData.period
        } : null
      }

      console.log('Sending registration request:', requestData)
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      console.log('Registration response status:', response.status)
      const result = await response.json()
      console.log('Registration response data:', result)

      if (!response.ok) {
        // Check if the error is about existing user but we actually got user data
        if (result.error?.includes('existe déjà') && result.user) {
          console.log('User already exists but got user data, proceeding to payment:', result)
          setCreatedUser(result.user)
          setSignupStep('payment')
          return
        }
        throw new Error(result.error || 'Erreur lors de l\'inscription')
      }

      console.log('Signup successful:', result)
      
      // Store user data and move to payment step
      setCreatedUser(result.user)
      setSignupStep('payment')
      
    } catch (error) {
      console.error('Signup error:', error)
      setPaymentError(error instanceof Error ? error.message : 'Erreur lors de l\'inscription')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle successful payment
  const handlePaymentSuccess = (paymentResult: any) => {
    console.log('Payment successful:', paymentResult)
    setSignupStep('success')
    
    // Redirect to admin subscription page after a short delay
    setTimeout(() => {
      window.location.href = '/admin/subscription'
    }, 3000)
  }

  // Handle payment error
  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error)
    setPaymentError(error)
  }

  // Render different steps
  if (signupStep === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md shadow-lg border-0">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              <h3 className="text-lg font-semibold text-green-800">Inscription Réussie !</h3>
              <p className="text-sm text-muted-foreground">
                Votre compte a été créé et votre paiement a été traité avec succès.
              </p>
              <p className="text-xs text-muted-foreground">
                Redirection vers votre espace client...
              </p>
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (signupStep === 'payment' && createdUser && selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-start justify-center pt-8 sm:pt-12 pb-4 sm:pb-8 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-3 sm:mb-4">
              <div className="p-2 sm:p-3 bg-gray-800 rounded-full shadow-md border border-gray-700">
                <Image
                  src="/logo.svg"
                  alt="Vistream Logo"
                  width={48}
                  height={48}
                  className="w-10 h-10 sm:w-12 sm:h-12"
                />
              </div>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Finaliser votre inscription</h1>
            <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
              Bonjour {createdUser.firstName}, finalisez votre abonnement {selectedPlan.name}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Plan Summary */}
            <div className="lg:order-2">
              <Card className="shadow-lg border-0 sticky top-8">
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl mb-2 flex items-center justify-center gap-2">
                    {getPlanIcon(selectedPlan.name)}
                    {selectedPlan.name}
                  </CardTitle>
                  <div className="mb-4">
                    <div className="flex items-baseline justify-center space-x-1">
                      <span className="text-3xl font-bold text-primary">
                        {selectedPlan.price}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        /{selectedPlan.period}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedPlan.description}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>Compte créé avec succès</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CreditCard className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0" />
                      <span>Paiement sécurisé</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>Activation immédiate</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Form */}
            <div className="lg:col-span-2 lg:order-1">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Paiement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentError && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{paymentError}</p>
                    </div>
                  )}
                  
                  <PaymentMethodSelector
                    amount={parseFloat(selectedPlan.price)}
                    currency="EUR"
                    description={`Abonnement ${selectedPlan.name} - ${selectedPlan.period}`}
                    customerEmail={createdUser.email}
                    customerName={`${createdUser.firstName} ${createdUser.lastName}`}
                    metadata={{
                      userId: createdUser._id,
                      planId: selectedPlan.id,
                      planName: selectedPlan.name,
                      source: 'signup'
                    }}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-start justify-center pt-8 sm:pt-12 pb-4 sm:pb-8 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl">
        {/* Logo and Back Button */}
        <div className="text-center mb-6 sm:mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-xs sm:text-sm text-muted-foreground hover:text-foreground mb-4 sm:mb-6 transition-colors duration-200 group"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            Retour à l'accueil
          </Link>
          <div className="flex justify-center mb-3 sm:mb-4">
            <div className="p-2 sm:p-3 bg-gray-800 rounded-full shadow-md border border-gray-700">
            <Image
              src="/logo.svg"
              alt="Vistream Logo"
              width={48}
              height={48}
                className="w-10 h-10 sm:w-12 sm:h-12"
            />
            </div>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Créer un compte</h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            {selectedPlan ? `Rejoignez Vistream avec le plan ${selectedPlan.name}` : 'Rejoignez Vistream et choisissez votre plan'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Plan Selection Display */}
          {selectedPlan && (
            <div className="lg:order-2">
              <Card className="shadow-lg border-0 sticky top-8">
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center mb-2">
                    {selectedPlan.highlight && (
                      <Badge className="bg-primary text-primary-foreground px-3 py-1 mb-2">
                        <Star className="h-3 w-3 mr-1" />
                        Recommandé
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-xl mb-2 flex items-center justify-center gap-2">
                    {getPlanIcon(selectedPlan.name)}
                    {selectedPlan.name}
                  </CardTitle>
                  <div className="mb-4">
                    <div className="flex items-baseline justify-center space-x-1">
                      <span className="text-3xl font-bold text-primary">
                        {selectedPlan.price}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        /{selectedPlan.period}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedPlan.description}</p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>Plan sélectionné pour votre compte</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>Activation immédiate après inscription</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>Changement de plan possible à tout moment</span>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground text-center">
                      Ce plan sera automatiquement associé à votre compte après inscription
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Signup Form */}
          <div className={selectedPlan ? "lg:col-span-2 lg:order-1" : "max-w-2xl mx-auto lg:col-span-3"}>
            <Card className="shadow-lg border-0">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-center flex items-center justify-center space-x-2">
                  <UserPlus className="h-5 w-5" />
                  <span>Inscription</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {paymentError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{paymentError}</p>
                  </div>
                )}
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Plan Selection - Only show if no plan is pre-selected */}
                    {!selectedPlan && (
                      <div className="mb-6">
                        <FormField
                          control={form.control}
                          name="selectedPlanId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-base font-semibold">Choisissez votre plan *</FormLabel>
                              <FormControl>
                                <Select 
                                  onValueChange={(value) => {
                                    field.onChange(value)
                                    handlePlanSelection(value)
                                  }} 
                                  value={field.value}
                                  disabled={plansLoading}
                                >
                                  <SelectTrigger className="h-12">
                                    <SelectValue placeholder={plansLoading ? "Chargement des plans..." : "Sélectionnez un plan"} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availablePlans.map((plan) => (
                                      <SelectItem key={plan._id} value={plan._id}>
                                        <div className="flex items-center justify-between w-full">
                                          <div className="flex items-center gap-3">
                                            {getPlanIcon(plan.name)}
                                            <div>
                                              <div className="flex items-center gap-2">
                                                <span className="font-medium">{plan.name}</span>
                                                {plan.highlight && (
                                                  <Badge variant="secondary" className="text-xs">
                                                    <Star className="h-3 w-3 mr-1" />
                                                    Recommandé
                                                  </Badge>
                                                )}
                                              </div>
                                              <div className="text-sm text-muted-foreground">
                                                {plan.price}/{plan.period} - {plan.description}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prénom</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="Jean" 
                                  className="pl-10"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input 
                                  placeholder="Dupont" 
                                  className="pl-10"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                type="email" 
                                placeholder="jean.dupont@example.com" 
                                className="pl-10"
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="phonePrefix"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pays</FormLabel>
                            <FormControl>
                              <div className="relative" ref={dropdownRef}>
                                <button
                                  type="button"
                                  onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                                  className="w-full h-10 px-3 py-2 text-sm border border-input bg-background rounded-md flex items-center justify-between hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                >
                                  <span className="flex items-center space-x-2">
                                    <span>{countries.find(c => c.code === field.value)?.flag}</span>
                                    <span>{field.value}</span>
                                  </span>
                                </button>
                                {showCountryDropdown && (
                                  <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-60 overflow-auto">
                                    {countries.map((country) => (
                                      <button
                                        key={country.code}
                                        type="button"
                                        onClick={() => {
                                          field.onChange(country.code)
                                          setShowCountryDropdown(false)
                                        }}
                                        className="w-full px-3 py-2 text-sm text-left hover:bg-accent hover:text-accent-foreground flex items-center space-x-2"
                                      >
                                        <span>{country.flag}</span>
                                        <span>{country.code}</span>
                                        <span className="text-muted-foreground">{country.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Téléphone</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                  <Input 
                                    type="tel" 
                                    placeholder="123456789" 
                                    className="pl-10"
                                    {...field} 
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Code d'affiliation (optionnel) */}
                    <FormField
                      control={form.control}
                      name="affiliationCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Code d'affiliation (optionnel)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                type="text" 
                                placeholder="1234" 
                                className="pl-10"
                                maxLength={4}
                                {...field} 
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Si vous avez été recommandé par un de nos utilisateurs, saisissez son code à 4 chiffres
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mot de passe</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                type={showPassword ? "text" : "password"} 
                                placeholder="••••••••" 
                                className="pl-10 pr-10"
                                {...field} 
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmer le mot de passe</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                type={showConfirmPassword ? "text" : "password"} 
                                placeholder="••••••••" 
                                className="pl-10 pr-10"
                                {...field} 
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Création du compte...
                        </>
                      ) : (
                        <>
                          <UserPlus className="mr-2 h-4 w-4" />
                          {selectedPlan ? `Créer mon compte avec ${selectedPlan.name}` : 'Créer mon compte'}
                        </>
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Déjà un compte ?{' '}
                    <Link href="/auth/login" className="text-primary hover:underline font-medium">
                      Se connecter
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            En créant un compte, vous acceptez nos{' '}
            <Link href="/legal" className="hover:underline">conditions d'utilisation</Link>
            {' '}et notre{' '}
            <Link href="/privacy" className="hover:underline">politique de confidentialité</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SignupForm />
    </Suspense>
  )
} 