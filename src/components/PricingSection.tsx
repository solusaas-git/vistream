'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, Star, Rocket, Loader2 } from 'lucide-react'

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

export default function PricingSection() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/plans')
        const data = await response.json()

        if (data.success) {
          // Filter only active plans and sort by order
          const activePlans = data.data.plans
            .filter((plan: Plan) => plan.isActive)
            .sort((a: Plan, b: Plan) => a.order - b.order)
          setPlans(activePlans)
        } else {
          console.error('Error fetching plans:', data.error)
          setError('Erreur lors du chargement des plans')
        }
      } catch (error) {
        console.error('Error fetching plans:', error)
        setError('Erreur de connexion')
      } finally {
        setLoading(false)
      }
    }

    fetchPlans()
  }, [])

  const handlePlanSelect = (plan: Plan) => {
    // Génération du lien avec attribution marketing utilisant le slug
    const attributionParams = {
      utm_source: 'pricing_page',
      utm_medium: 'website', 
      utm_campaign: 'plan_selection',
      utm_content: plan.name.toLowerCase(),
      referrer: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: new Date().toISOString()
    }

    const params = new URLSearchParams({
      plan: plan.slug, // Utiliser le slug au lieu de plan_id
      ...attributionParams
    })

    // Utiliser router.push pour une navigation côté client plus fluide
    router.push(`/auth/signup?${params.toString()}`)
  }

  if (loading) {
    return (
      <section id="pricing" className="py-12 sm:py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">Plans & Tarifs</h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl lg:max-w-3xl mx-auto">
              Choisissez le plan qui correspond à vos besoins
            </p>
          </div>
          <div className="flex justify-center items-center py-8 sm:py-12">
            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    )
  }

  if (error || plans.length === 0) {
    return (
      <section id="pricing" className="py-12 sm:py-16 lg:py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">Plans & Tarifs</h2>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl lg:max-w-3xl mx-auto">
              Choisissez le plan qui correspond à vos besoins
            </p>
          </div>
          <div className="text-center py-8 sm:py-12">
            <p className="text-sm sm:text-base text-muted-foreground">
              {error || 'Aucun plan disponible pour le moment'}
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="pricing" className="py-12 sm:py-16 lg:py-20 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12 lg:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">Plans & Tarifs</h2>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl lg:max-w-3xl mx-auto">
            Choisissez le plan qui correspond à vos besoins
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`${plan.highlight && plans.length === 3 ? 'sm:col-span-2 lg:col-span-1' : ''}`}
            >
              <Card className={`relative h-full flex flex-col shadow-lg hover:shadow-xl transition-all duration-300 ${
                plan.highlight 
                  ? 'border-primary shadow-lg ring-2 ring-primary/20 sm:scale-105' 
                  : 'border-2 hover:border-primary/30 hover:shadow-lg'
                }`}>
                {plan.highlight && (
                  <div className="absolute -top-3 sm:-top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs sm:text-sm shadow-lg">
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Recommandé
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4 sm:pb-6 pt-6 sm:pt-8">
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl mb-2 sm:mb-3">{plan.name}</CardTitle>
                  <div className="mb-3 sm:mb-4">
                    <div className="flex items-baseline justify-center space-x-1">
                      <span className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                        {plan.price}
                      </span>
                      <span className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                        /{plan.period}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm lg:text-base text-muted-foreground leading-relaxed px-2">{plan.description}</p>
                </CardHeader>
                
                <CardContent className="pt-0 flex-1 flex flex-col px-4 sm:px-6 pb-4 sm:pb-6">
                  <ul className="space-y-2 sm:space-y-3 mb-6 sm:mb-8 flex-1">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start text-xs sm:text-sm lg:text-base">
                        <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 mt-0.5 flex-shrink-0" />
                        <span className="leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4 sm:pt-6 border-t border-muted">
                    <Button 
                      className="w-full h-10 sm:h-12 text-sm sm:text-base font-medium" 
                      variant={plan.highlight ? "default" : "outline"}
                      onClick={() => handlePlanSelect(plan)}
                    >
                      <Rocket className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      Commencer maintenant
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
} 