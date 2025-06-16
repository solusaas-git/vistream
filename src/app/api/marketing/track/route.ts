import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongoose'
import MarketingAttribution, { IMarketingAttribution } from '@/models/MarketingAttribution'
import { withAdmin } from '@/lib/rbac'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    await connectToDatabase()
    
    // Créer un enregistrement d'attribution marketing
    const attribution = new MarketingAttribution({
      userId: data.userId || null,
      email: data.email || null,
      planId: data.planId,
      planName: data.planName,
      planPrice: data.planPrice,
      planPeriod: data.planPeriod,
      // Paramètres UTM
      utmSource: data.utm_source,
      utmMedium: data.utm_medium,
      utmCampaign: data.utm_campaign,
      utmContent: data.utm_content,
      utmTerm: data.utm_term,
      // Paramètres personnalisés
      referrer: data.referrer,
      campaignId: data.campaign_id,
      affiliateId: data.affiliate_id,
      promoCode: data.promo_code,
      // Métadonnées
      userAgent: request.headers.get('user-agent'),
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown',
      timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      conversionType: data.conversionType || 'signup_started',
      conversionValue: data.conversionValue || 0
    })
    
    await attribution.save()
    
    return NextResponse.json({
      success: true,
      message: 'Attribution trackée avec succès',
      attributionId: attribution._id
    })
    
  } catch (error) {
    console.error('Erreur lors du tracking marketing:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors du tracking' },
      { status: 500 }
    )
  }
}

interface StatsData {
  [key: string]: { count: number; value: number }
}

export const GET = withAdmin(async (request: NextRequest, user) => {
  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaign_id')
    const utmSource = searchParams.get('utm_source')
    const utmCampaign = searchParams.get('utm_campaign')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    
    await connectToDatabase()
    
    // Construire la requête de filtrage
    const query: any = {}
    
    if (campaignId) query.campaignId = campaignId
    if (utmSource) query.utmSource = utmSource
    if (utmCampaign) query.utmCampaign = utmCampaign
    
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }
    
    // Récupérer les données d'attribution
    const attributions = await MarketingAttribution.find(query)
      .sort({ createdAt: -1 })
      .limit(1000)
    
    // Calculer les statistiques
    const stats = {
      totalConversions: attributions.length,
      totalValue: attributions.reduce((sum: number, attr: IMarketingAttribution) => sum + (attr.conversionValue || 0), 0),
      bySource: {} as StatsData,
      byCampaign: {} as StatsData,
      byPlan: {} as StatsData,
      conversionsByDay: {} as StatsData
    }
    
    // Grouper par source
    attributions.forEach((attr: IMarketingAttribution) => {
      const source = attr.utmSource || 'direct'
      if (!stats.bySource[source]) {
        stats.bySource[source] = { count: 0, value: 0 }
      }
      stats.bySource[source].count++
      stats.bySource[source].value += attr.conversionValue || 0
    })
    
    // Grouper par campagne
    attributions.forEach((attr: IMarketingAttribution) => {
      const campaign = attr.utmCampaign || 'unknown'
      if (!stats.byCampaign[campaign]) {
        stats.byCampaign[campaign] = { count: 0, value: 0 }
      }
      stats.byCampaign[campaign].count++
      stats.byCampaign[campaign].value += attr.conversionValue || 0
    })
    
    // Grouper par plan
    attributions.forEach((attr: IMarketingAttribution) => {
      const plan = attr.planName || 'unknown'
      if (!stats.byPlan[plan]) {
        stats.byPlan[plan] = { count: 0, value: 0 }
      }
      stats.byPlan[plan].count++
      stats.byPlan[plan].value += attr.conversionValue || 0
    })
    
    return NextResponse.json({
      success: true,
      data: {
        attributions: attributions.slice(0, 100), // Limiter pour la performance
        stats
      }
    })
    
  } catch (error) {
    console.error('Erreur lors de la récupération des données marketing:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération' },
      { status: 500 }
    )
  }
}) 