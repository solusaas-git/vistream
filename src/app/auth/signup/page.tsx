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
import { ArrowLeft, Eye, EyeOff, UserPlus, Mail, Lock, User, Loader2, Phone, ChevronDown, Star, Check, Crown, Shield, Hash } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
    setIsLoading(true)
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

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'inscription')
      }

      console.log('Signup successful:', result)
      
      // Redirect based on user role (default to customer)
      const userRole = result.user?.role || 'customer'
      if (userRole === 'customer') {
        window.location.href = '/admin/subscription'
      } else {
        window.location.href = '/admin'
      }
    } catch (error) {
      console.error('Signup error:', error)
      // You could add toast notification here
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'inscription')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-5xl">
        {/* Logo and Back Button */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Link>
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.svg"
              alt="Vistream Logo"
              width={48}
              height={48}
              className="w-12 h-12"
            />
          </div>
          <h1 className="text-2xl font-bold">Créer un compte</h1>
          <p className="text-muted-foreground mt-2">
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