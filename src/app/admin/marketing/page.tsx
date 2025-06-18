'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target,
  Mail,
  Share2,
  MousePointer,
  Gift,
  Download,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  Loader2,
  Eye,
  Copy,
  CheckCircle,
  Calendar,
  Hash,
  User
} from 'lucide-react'

interface MarketingAttribution {
  _id: string
  planId: string
  planName: string
  planPrice: string
  planPeriod: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
  referrer?: string
  campaignId?: string
  affiliateId?: string
  promoCode?: string
  userAgent?: string
  ipAddress?: string
  timestamp: string
  conversionType: string
  conversionValue: number
  createdAt: string
}

interface MarketingStats {
  totalConversions: number
  totalValue: number
  bySource: { [key: string]: { count: number; value: number } }
  byCampaign: { [key: string]: { count: number; value: number } }
  byPlan: { [key: string]: { count: number; value: number } }
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

interface AffiliationStats {
  totalStats: {
    totalSales: number
    totalValue: number
    totalAffiliates: number
  }
  userStats: Array<{
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
      affiliationCode: string
    }
    totalSales: number
    totalValue: number
    sales: Array<{
      id: string
      customer: any
      planName: string
      planPrice: string
      planPeriod: string
      saleValue: number
      status: string
      createdAt: string
    }>
  }>
  recentSales: Array<{
    id: string
    customer: any
    affiliatedUser: any
    planName: string
    planPrice: string
    saleValue: number
    affiliationCode: string
    createdAt: string
  }>
}

export default function AdminMarketingPage() {
  const [attributions, setAttributions] = useState<MarketingAttribution[]>([])
  const [stats, setStats] = useState<MarketingStats>({
    totalConversions: 0,
    totalValue: 0,
    bySource: {},
    byCampaign: {},
    byPlan: {}
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [filters, setFilters] = useState({
    source: '',
    campaign: '',
    plan: '',
    startDate: '',
    endDate: ''
  })
  const [plans, setPlans] = useState<Plan[]>([])
  const [generatedLinks, setGeneratedLinks] = useState<{[key: string]: string}>({})
  const [copiedLink, setCopiedLink] = useState<string | null>(null)

  // États pour les affiliations
  const [affiliationStats, setAffiliationStats] = useState<AffiliationStats | null>(null)
  const [affiliationLoading, setAffiliationLoading] = useState(false)
  const [affiliationFilters, setAffiliationFilters] = useState({
    userId: 'all',
    planId: 'all',
    affiliationCode: '',
    startDate: '',
    endDate: '',
    dateRange: ''
  })

  // Liste des utilisateurs pour le filtre
  const [users, setUsers] = useState<Array<{id: string, firstName: string, lastName: string, email: string, affiliationCode: string}>>([])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      
      const response = await fetch(`/api/marketing/track?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setAttributions(data.data.attributions || [])
        setStats(data.data.stats || {
          totalConversions: 0,
          totalValue: 0,
          bySource: {},
          byCampaign: {},
          byPlan: {}
        })
      }
    } catch (error) {
      // Error loading marketing data - handled silently
    } finally {
      setLoading(false)
    }
  }, [filters])

  const fetchPlans = useCallback(async () => {
    try {
      const response = await fetch('/api/plans')
      const data = await response.json()
      
      if (data.success) {
        const activePlans = data.data.plans.filter((plan: Plan) => plan.isActive)
        setPlans(activePlans)
      }
    } catch (error) {
      // Error loading plans - handled silently
    }
  }, [])

  const fetchAffiliationStats = useCallback(async () => {
    try {
      setAffiliationLoading(true)
      const params = new URLSearchParams()
      
      // Ajouter les filtres d'affiliation
      Object.entries(affiliationFilters).forEach(([key, value]) => {
        if (value && key !== 'dateRange' && value !== 'all') {
          params.append(key, value)
        }
      })
      
      const response = await fetch(`/api/admin/affiliations?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setAffiliationStats(data.data)
        // Extraire la liste des utilisateurs pour le filtre
        if (data.data.userStats) {
          setUsers(data.data.userStats.map((stat: any) => stat.user))
        }
      }
    } catch (error) {
      // Error loading affiliation stats - handled silently
    } finally {
      setAffiliationLoading(false)
    }
  }, [affiliationFilters])

  useEffect(() => {
    fetchData()
    fetchPlans()
    fetchAffiliationStats()
  }, [fetchData, fetchPlans, fetchAffiliationStats])

  useEffect(() => {
    if (Object.values(filters).some(v => v)) {
      fetchData()
    }
  }, [fetchData, filters])

  useEffect(() => {
    if (activeTab === 'affiliations' && !affiliationStats) {
      fetchAffiliationStats()
    }
  }, [activeTab, affiliationStats, fetchAffiliationStats])

  // useEffect pour les filtres d'affiliation
  useEffect(() => {
    if (activeTab === 'affiliations') {
      fetchAffiliationStats()
    }
  }, [affiliationFilters, activeTab, fetchAffiliationStats])

  // Fonction pour gérer les accès rapides de dates
  const handleDateRangeQuickSelect = (range: string) => {
    const now = new Date()
    let startDate = ''
    let endDate = now.toISOString().split('T')[0]

    switch (range) {
      case 'today':
        startDate = now.toISOString().split('T')[0]
        break
      case 'week':
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        startDate = weekStart.toISOString().split('T')[0]
        break
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        startDate = monthStart.toISOString().split('T')[0]
        break
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1)
        startDate = yearStart.toISOString().split('T')[0]
        break
      default:
        startDate = ''
        endDate = ''
    }

    setAffiliationFilters(prev => ({
      ...prev,
      startDate,
      endDate,
      dateRange: range
    }))
  }

  // Réinitialiser les filtres d'affiliation
  const resetAffiliationFilters = () => {
    setAffiliationFilters({
      userId: 'all',
      planId: 'all',
      affiliationCode: '',
      startDate: '',
      endDate: '',
      dateRange: ''
    })
  }

  const generateMarketingLink = (type: string, plan: Plan) => {
    const baseUrl = window.location.origin

    let params: any = {
      plan: plan.slug,
      timestamp: new Date().toISOString()
    }

    switch (type) {
      case 'email':
        params = {
          ...params,
          utm_source: 'email',
          utm_medium: 'email',
          utm_campaign: 'admin_generated',
          utm_content: plan.name.toLowerCase()
        }
        break
      case 'facebook':
        params = {
          ...params,
          utm_source: 'facebook',
          utm_medium: 'social',
          utm_campaign: 'social_media_promotion',
          utm_content: plan.name.toLowerCase()
        }
        break
      case 'google':
        params = {
          ...params,
          utm_source: 'google',
          utm_medium: 'cpc',
          utm_campaign: 'paid_advertising',
          utm_content: plan.name.toLowerCase()
        }
        break
      case 'affiliate':
        params = {
          ...params,
          utm_source: 'affiliate',
          utm_medium: 'referral',
          utm_campaign: 'affiliate_program',
          utm_content: plan.name.toLowerCase(),
          affiliate_id: 'admin_generated'
        }
        break
      case 'promo':
        params = {
          ...params,
          utm_source: 'promo',
          utm_medium: 'promotion',
          utm_campaign: 'promo_code',
          utm_content: plan.name.toLowerCase(),
          promo_code: 'ADMIN20'
        }
        break
    }

    const searchParams = new URLSearchParams(params)
    return `${baseUrl}/auth/signup?${searchParams.toString()}`
  }

  const handleGenerateLinks = (plan: Plan) => {
    const links = {
      email: generateMarketingLink('email', plan),
      facebook: generateMarketingLink('facebook', plan),
      google: generateMarketingLink('google', plan),
      affiliate: generateMarketingLink('affiliate', plan),
      promo: generateMarketingLink('promo', plan)
    }
    setGeneratedLinks(links)
  }

  const copyToClipboard = async (link: string, type: string) => {
    try {
      await navigator.clipboard.writeText(link)
      setCopiedLink(type)
      setTimeout(() => setCopiedLink(null), 2000)
    } catch (error) {
      // Error copying to clipboard - handled silently
    }
  }

  const exportData = () => {
    const csvContent = [
      ['Date', 'Plan', 'Source', 'Campagne', 'Type Conversion', 'Valeur'].join(','),
      ...attributions.map(attr => [
        new Date(attr.createdAt).toLocaleDateString(),
        attr.planName,
        attr.utmSource || '',
        attr.utmCampaign || '',
        attr.conversionType,
        attr.conversionValue
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `marketing-attributions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getSourceIcon = (source: string) => {
    switch (source?.toLowerCase()) {
      case 'email': return <Mail className="h-4 w-4" />
      case 'facebook': case 'instagram': case 'twitter': case 'linkedin': return <Share2 className="h-4 w-4" />
      case 'google': case 'cpc': return <MousePointer className="h-4 w-4" />
      case 'affiliate': return <Users className="h-4 w-4" />
      case 'promo': return <Gift className="h-4 w-4" />
      default: return <Target className="h-4 w-4" />
    }
  }

  const getConversionBadgeColor = (type: string) => {
    switch (type) {
      case 'signup_started': return 'bg-blue-100 text-blue-800'
      case 'signup_completed': return 'bg-green-100 text-green-800'
      case 'subscription_created': return 'bg-purple-100 text-purple-800'
      case 'payment_completed': return 'bg-emerald-100 text-emerald-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Marketing & Attribution</h1>
          <p className="text-muted-foreground">
            Analysez les performances de vos campagnes et générez des liens marketing
          </p>
        </div>
        <Button onClick={exportData} variant="outline" disabled={attributions.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Conversions</p>
                  <p className="text-2xl font-bold">{stats.totalConversions}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valeur Totale</p>
                  <p className="text-2xl font-bold">{stats.totalValue.toLocaleString()}€</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sources Actives</p>
                  <p className="text-2xl font-bold">{Object.keys(stats.bySource).length}</p>
                </div>
                <Target className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Campagnes</p>
                  <p className="text-2xl font-bold">{Object.keys(stats.byCampaign).length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="generator" className="space-y-6" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="generator">Générateur de Liens</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="attributions">Attributions</TabsTrigger>
          <TabsTrigger value="affiliations">Ventes par Affiliation</TabsTrigger>
        </TabsList>

        {/* Générateur de Liens Tab */}
        <TabsContent value="generator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Générateur de Liens Marketing</CardTitle>
              <p className="text-muted-foreground">
                Générez des liens d'inscription optimisés avec attribution marketing pour vos campagnes
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card key={plan._id} className="relative">
                    {plan.highlight && (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground">
                          Recommandé
                        </Badge>
                      </div>
                    )}
                    <CardHeader className="text-center">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <div className="text-2xl font-bold text-primary">
                        {plan.price}/{plan.period}
                      </div>
                      <p className="text-sm text-muted-foreground">{plan.description}</p>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        className="w-full" 
                        onClick={() => handleGenerateLinks(plan)}
                        variant={plan.highlight ? "default" : "outline"}
                      >
                        Générer les liens
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Liens générés */}
              {generatedLinks && Object.keys(generatedLinks).length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">
                    Liens marketing pour {Object.values(generatedLinks)[0] ? Object.values(generatedLinks)[0].split('?')[0].split('/').pop() : 'Plan sélectionné'}
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(generatedLinks).map(([type, link]) => (
                      <Card key={type}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getSourceIcon(type)}
                              <div>
                                <div className="font-medium capitalize">{type}</div>
                                <div className="text-sm text-muted-foreground">
                                  {type === 'email' && 'Campagnes email et newsletters'}
                                  {type === 'facebook' && 'Posts et publicités Facebook'}
                                  {type === 'google' && 'Google Ads et campagnes payantes'}
                                  {type === 'affiliate' && 'Programme d\'affiliation'}
                                  {type === 'promo' && 'Codes promotionnels'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(link, '_blank')}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Prévisualiser
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => copyToClipboard(link, type)}
                                className={copiedLink === type ? 'bg-green-500' : ''}
                              >
                                {copiedLink === type ? (
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                ) : (
                                  <Copy className="h-4 w-4 mr-1" />
                                )}
                                {copiedLink === type ? 'Copié!' : 'Copier'}
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2 p-2 bg-muted rounded text-xs font-mono break-all">
                            {link}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Filtres */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label>Source UTM</Label>
                  <Input
                    placeholder="email, facebook..."
                    value={filters.source}
                    onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Campagne</Label>
                  <Input
                    placeholder="welcome_series..."
                    value={filters.campaign}
                    onChange={(e) => setFilters(prev => ({ ...prev, campaign: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Date début</Label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Date fin</Label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
                <div className="flex items-end">
                                     <Button onClick={() => setFilters({ source: '', campaign: '', plan: '', startDate: '', endDate: '' })}>
                     Réinitialiser
                   </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance par Source */}
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance par Source
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.keys(stats.bySource).length > 0 ? (
                      Object.entries(stats.bySource)
                        .sort(([,a], [,b]) => b.count - a.count)
                        .slice(0, 5)
                        .map(([source, data]) => (
                          <div key={source} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getSourceIcon(source)}
                              <span className="font-medium capitalize">{source}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{data.count} conversions</div>
                              <div className="text-sm text-muted-foreground">{data.value.toLocaleString()}€</div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        Aucune donnée disponible
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Top Campagnes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.keys(stats.byCampaign).length > 0 ? (
                      Object.entries(stats.byCampaign)
                        .sort(([,a], [,b]) => b.count - a.count)
                        .slice(0, 5)
                        .map(([campaign, data]) => (
                          <div key={campaign} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4" />
                              <span className="font-medium">{campaign}</span>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{data.count} conversions</div>
                              <div className="text-sm text-muted-foreground">{data.value.toLocaleString()}€</div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <p className="text-muted-foreground text-center py-4">
                        Aucune donnée disponible
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Attributions Tab */}
        <TabsContent value="attributions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Attributions</CardTitle>
              <p className="text-muted-foreground">
                Toutes les conversions trackées avec leurs détails d'attribution
              </p>
            </CardHeader>
            <CardContent>
              {attributions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Campagne</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Valeur</TableHead>
                        <TableHead>IP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attributions.map((attr) => (
                        <TableRow key={attr._id}>
                          <TableCell>
                            {new Date(attr.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{attr.planName}</div>
                              <div className="text-sm text-muted-foreground">
                                {attr.planPrice}/{attr.planPeriod}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getSourceIcon(attr.utmSource || '')}
                              <span className="capitalize">{attr.utmSource || 'Direct'}</span>
                            </div>
                          </TableCell>
                          <TableCell>{attr.utmCampaign || '-'}</TableCell>
                          <TableCell>
                            <Badge className={getConversionBadgeColor(attr.conversionType)}>
                              {attr.conversionType}
                            </Badge>
                          </TableCell>
                          <TableCell>{attr.conversionValue}€</TableCell>
                          <TableCell className="font-mono text-xs">
                            {attr.ipAddress}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Aucune attribution marketing enregistrée pour le moment
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Les conversions apparaîtront ici une fois que des utilisateurs s'inscriront via vos liens marketing
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ventes par Affiliation Tab */}
        <TabsContent value="affiliations" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Ventes par Affiliation</h2>
              <p className="text-muted-foreground">
                Suivez les performances de vos utilisateurs affiliés et leurs ventes
              </p>
            </div>
            <Button onClick={fetchAffiliationStats} disabled={affiliationLoading}>
              {affiliationLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Activity className="h-4 w-4 mr-2" />
              )}
              Actualiser
            </Button>
          </div>

          {/* Filtres d'affiliation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Première ligne de filtres */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Utilisateur</Label>
                    <Select 
                      value={affiliationFilters.userId} 
                      onValueChange={(value) => setAffiliationFilters(prev => ({ ...prev, userId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les utilisateurs" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les utilisateurs</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {user.firstName} {user.lastName}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Plan</Label>
                    <Select 
                      value={affiliationFilters.planId} 
                      onValueChange={(value) => setAffiliationFilters(prev => ({ ...prev, planId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les plans" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les plans</SelectItem>
                        {plans.map((plan) => (
                          <SelectItem key={plan._id} value={plan._id}>
                            {plan.name} - {plan.price}/{plan.period}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Code d'affiliation</Label>
                    <Input
                      placeholder="Ex: 1234"
                      value={affiliationFilters.affiliationCode}
                      onChange={(e) => setAffiliationFilters(prev => ({ ...prev, affiliationCode: e.target.value }))}
                      className="font-mono"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button onClick={resetAffiliationFilters} variant="outline" className="w-full">
                      Réinitialiser
                    </Button>
                  </div>
                </div>

                {/* Deuxième ligne - Filtres de dates */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  <div>
                    <Label>Date début</Label>
                    <Input
                      type="date"
                      value={affiliationFilters.startDate}
                      onChange={(e) => setAffiliationFilters(prev => ({ ...prev, startDate: e.target.value, dateRange: '' }))}
                    />
                  </div>

                  <div>
                    <Label>Date fin</Label>
                    <Input
                      type="date"
                      value={affiliationFilters.endDate}
                      onChange={(e) => setAffiliationFilters(prev => ({ ...prev, endDate: e.target.value, dateRange: '' }))}
                    />
                  </div>

                  {/* Accès rapides de dates */}
                  <div className="md:col-span-4">
                    <Label>Accès rapides</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <Button
                        size="sm"
                        variant={affiliationFilters.dateRange === 'today' ? 'default' : 'outline'}
                        onClick={() => handleDateRangeQuickSelect('today')}
                        className="flex items-center gap-1"
                      >
                        <Calendar className="h-3 w-3" />
                        Aujourd'hui
                      </Button>
                      <Button
                        size="sm"
                        variant={affiliationFilters.dateRange === 'week' ? 'default' : 'outline'}
                        onClick={() => handleDateRangeQuickSelect('week')}
                        className="flex items-center gap-1"
                      >
                        <Calendar className="h-3 w-3" />
                        Cette semaine
                      </Button>
                      <Button
                        size="sm"
                        variant={affiliationFilters.dateRange === 'month' ? 'default' : 'outline'}
                        onClick={() => handleDateRangeQuickSelect('month')}
                        className="flex items-center gap-1"
                      >
                        <Calendar className="h-3 w-3" />
                        Ce mois
                      </Button>
                      <Button
                        size="sm"
                        variant={affiliationFilters.dateRange === 'year' ? 'default' : 'outline'}
                        onClick={() => handleDateRangeQuickSelect('year')}
                        className="flex items-center gap-1"
                      >
                        <Calendar className="h-3 w-3" />
                        Cette année
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Indicateur de filtres actifs */}
                {(affiliationFilters.userId || affiliationFilters.planId || affiliationFilters.affiliationCode || affiliationFilters.startDate || affiliationFilters.endDate) && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <Filter className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-800 font-medium">
                      Filtres actifs: 
                      {affiliationFilters.userId && ' Utilisateur'}
                      {affiliationFilters.planId && ' Plan'}
                      {affiliationFilters.affiliationCode && ' Code'}
                      {(affiliationFilters.startDate || affiliationFilters.endDate) && ' Période'}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats globales d'affiliation */}
          {affiliationStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Ventes</p>
                      <p className="text-2xl font-bold">{affiliationStats.totalStats.totalSales}</p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Valeur Totale</p>
                      <p className="text-2xl font-bold">{affiliationStats.totalStats.totalValue.toLocaleString()}€</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Affiliés Actifs</p>
                      <p className="text-2xl font-bold">{affiliationStats.totalStats.totalAffiliates}</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Top Performers */}
          {affiliationStats && affiliationStats.userStats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Ventes</TableHead>
                        <TableHead>Valeur Totale</TableHead>
                        <TableHead>Valeur Moyenne</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {affiliationStats.userStats.slice(0, 10).map((userStat) => (
                        <TableRow key={userStat.user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {userStat.user.firstName} {userStat.user.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {userStat.user.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {userStat.user.affiliationCode}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold">{userStat.totalSales}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-green-600">
                              {userStat.totalValue.toLocaleString()}€
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-muted-foreground">
                              {userStat.totalSales > 0 ? (userStat.totalValue / userStat.totalSales).toFixed(2) : '0'}€
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4 mr-1" />
                              Détails
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ventes récentes */}
          {affiliationStats && affiliationStats.recentSales.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Ventes Récentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Affilié</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Valeur</TableHead>
                        <TableHead>Code</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {affiliationStats.recentSales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>
                            {new Date(sale.createdAt).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {sale.customer?.firstName} {sale.customer?.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {sale.customer?.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {sale.affiliatedUser?.firstName} {sale.affiliatedUser?.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {sale.affiliatedUser?.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{sale.planName}</div>
                              <div className="text-sm text-muted-foreground">
                                {sale.planPrice}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-green-600">
                              {sale.saleValue.toLocaleString()}€
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {sale.affiliationCode}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Message si pas de données */}
          {affiliationStats && affiliationStats.userStats.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucune vente par affiliation</h3>
                <p className="text-muted-foreground mb-4">
                  Les ventes réalisées via les codes d'affiliation apparaîtront ici
                </p>
                <p className="text-sm text-muted-foreground">
                  Vos utilisateurs peuvent partager leur code à 4 chiffres pour tracker leurs ventes
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 