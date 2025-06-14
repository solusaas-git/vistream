/**
 * Utilitaires pour générer des liens marketing avec attribution
 * Permet de tracker les conversions et l'efficacité des campagnes
 */

interface Plan {
  _id: string
  name: string
  description: string
  price: string
  period: string
  highlight: boolean
  slug: string
}

interface MarketingParams {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  // Paramètres personnalisés
  referrer?: string
  campaign_id?: string
  affiliate_id?: string
  promo_code?: string
}

/**
 * Génère un lien d'inscription avec attribution marketing
 * @param planSlug - Slug du plan sélectionné
 * @param utmParams - Paramètres UTM pour le tracking
 * @param customParams - Paramètres personnalisés optionnels
 */
export function generatePlanSignupLink(
  planSlug: string,
  utmParams: {
    utm_source: string
    utm_medium: string
    utm_campaign: string
    utm_content?: string
    utm_term?: string
  },
  customParams: {
    campaign_id?: string
    affiliate_id?: string
    promo_code?: string
    referrer?: string
  } = {}
): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  const params = new URLSearchParams({
    plan: planSlug,
    ...utmParams,
    ...customParams,
    timestamp: new Date().toISOString()
  })

  return `${baseUrl}/auth/signup?${params.toString()}`
}

/**
 * Génère des liens marketing pour différentes campagnes
 */
export class MarketingLinkGenerator {
  private baseUrl: string

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  }

  /**
   * Génère un lien d'inscription pour une campagne email
   * @param plan - Plan sélectionné
   * @param campaignName - Nom de la campagne email
   * @param emailId - ID optionnel de l'email
   */
  emailCampaign(plan: Plan, campaignName: string, emailId?: string): string {
    return generatePlanSignupLink(plan.slug, {
      utm_source: 'email',
      utm_medium: 'email',
      utm_campaign: campaignName,
      utm_content: plan.name.toLowerCase()
    }, {
      ...(emailId && { campaign_id: emailId })
    })
  }

  /**
   * Génère un lien d'inscription pour les réseaux sociaux
   * @param plan - Plan sélectionné
   * @param platform - Plateforme sociale
   * @param postId - ID optionnel du post
   */
  socialMedia(plan: Plan, platform: 'facebook' | 'twitter' | 'linkedin' | 'instagram', postId?: string): string {
    return generatePlanSignupLink(plan.slug, {
      utm_source: platform,
      utm_medium: 'social',
      utm_campaign: 'social_media_promotion',
      utm_content: plan.name.toLowerCase()
    }, {
      ...(postId && { campaign_id: postId })
    })
  }

  /**
   * Génère un lien d'inscription pour les publicités payantes
   * @param plan - Plan sélectionné
   * @param platform - Plateforme publicitaire
   * @param adId - ID optionnel de la publicité
   * @param keyword - Mot-clé optionnel
   */
  paidAds(plan: Plan, platform: 'google' | 'facebook' | 'linkedin', adId?: string, keyword?: string): string {
    return generatePlanSignupLink(plan.slug, {
      utm_source: platform,
      utm_medium: 'cpc',
      utm_campaign: 'paid_advertising',
      utm_content: plan.name.toLowerCase(),
      ...(keyword && { utm_term: keyword })
    }, {
      ...(adId && { campaign_id: adId })
    })
  }

  /**
   * Génère un lien d'inscription pour le programme d'affiliation
   * @param plan - Plan sélectionné
   * @param affiliateId - ID de l'affilié
   * @param campaignName - Nom optionnel de la campagne
   */
  affiliate(plan: Plan, affiliateId: string, campaignName?: string): string {
    return generatePlanSignupLink(plan.slug, {
      utm_source: 'affiliate',
      utm_medium: 'referral',
      utm_campaign: campaignName || 'affiliate_program',
      utm_content: plan.name.toLowerCase()
    }, {
      affiliate_id: affiliateId
    })
  }

  /**
   * Génère un lien d'inscription avec code promo
   * @param plan - Plan sélectionné
   * @param promoCode - Code promotionnel
   * @param source - Source optionnelle
   */
  promoCode(plan: Plan, promoCode: string, source?: string): string {
    return generatePlanSignupLink(plan.slug, {
      utm_source: source || 'promo',
      utm_medium: 'promotion',
      utm_campaign: 'promo_code',
      utm_content: plan.name.toLowerCase()
    }, {
      promo_code: promoCode
    })
  }

  /**
   * Génère un lien d'inscription pour une landing page
   * @param plan - Plan sélectionné
   * @param pageName - Nom de la page
   * @param source - Source optionnelle
   */
  landingPage(plan: Plan, pageName: string, source?: string): string {
    return generatePlanSignupLink(plan.slug, {
      utm_source: source || 'landing_page',
      utm_medium: 'website',
      utm_campaign: pageName,
      utm_content: plan.name.toLowerCase()
    }, {
      referrer: `landing_page_${pageName}`
    })
  }
}

/**
 * Instance par défaut du générateur de liens
 */
export const marketingLinks = new MarketingLinkGenerator()

/**
 * Exemples d'utilisation :
 * 
 * // Lien simple avec attribution
 * const link = generatePlanSignupLink(plan.slug, {
 *   utm_source: 'newsletter',
 *   utm_campaign: 'summer_2024'
 * })
 * 
 * // Lien pour campagne email
 * const emailLink = marketingLinks.emailCampaign(plan, 'welcome_series', 'email_001')
 * 
 * // Lien pour Facebook Ads
 * const fbLink = marketingLinks.paidAds(plan, 'facebook', 'ad_123', 'streaming video')
 * 
 * // Lien d'affiliation
 * const affiliateLink = marketingLinks.affiliate(plan, 'partner_xyz')
 */ 