# 📈 Système d'Attribution Marketing - Vistream

## Vue d'ensemble

Le système d'attribution marketing de Vistream permet de tracker précisément l'origine de chaque inscription et conversion. Il utilise les paramètres UTM standards et des paramètres personnalisés pour une attribution complète.

## 🎯 Fonctionnalités

### ✅ Attribution Automatique
- **Tracking UTM** : Source, medium, campaign, content, term
- **Paramètres personnalisés** : Campaign ID, Affiliate ID, Promo codes
- **Métadonnées** : IP, User Agent, Timestamp, Referrer
- **Conversions** : Signup started, completed, subscription created

### ✅ Liens Marketing Intelligents
- **Génération automatique** : Liens avec attribution complète
- **Templates prédéfinis** : Email, Social, Ads, Affiliate, Promo
- **Personnalisation** : Paramètres flexibles pour chaque campagne

### ✅ Tracking en Temps Réel
- **API de tracking** : `/api/marketing/track`
- **Statistiques** : Conversions par source, campagne, plan
- **Reporting** : Données exportables et analysables

## 🔗 Génération de Liens Marketing

### Utilisation Basique

```typescript
import { marketingLinks, generatePlanSignupLink } from '@/lib/marketing-links'

// Lien simple avec attribution
const link = generatePlanSignupLink(plan, {
  utm_source: 'newsletter',
  utm_campaign: 'summer_2024'
})
```

### Templates Prédéfinis

#### 📧 Campagnes Email
```typescript
// Newsletter mensuelle
const emailLink = marketingLinks.emailCampaign(
  plan, 
  'monthly_newsletter', 
  'dec_2024'
)

// Séquence de bienvenue
const welcomeLink = marketingLinks.emailCampaign(
  plan, 
  'welcome_series', 
  'email_003'
)
```

#### 📱 Réseaux Sociaux
```typescript
// Post Facebook
const facebookLink = marketingLinks.socialMedia(
  plan, 
  'facebook', 
  'post_123'
)

// Story Instagram
const instagramLink = marketingLinks.socialMedia(
  plan, 
  'instagram', 
  'story_456'
)

// Tweet
const twitterLink = marketingLinks.socialMedia(
  plan, 
  'twitter', 
  'tweet_789'
)
```

#### 💰 Publicité Payante
```typescript
// Google Ads
const googleLink = marketingLinks.paidAds(
  plan, 
  'google', 
  'ad_123', 
  'streaming video'
)

// Facebook Ads
const facebookAdsLink = marketingLinks.paidAds(
  plan, 
  'facebook', 
  'ad_456', 
  'video platform'
)
```

#### 🤝 Programme d'Affiliation
```typescript
// Partenaire média
const affiliateLink = marketingLinks.affiliate(
  plan, 
  'techcrunch', 
  'media_partnership'
)

// Influenceur
const influencerLink = marketingLinks.affiliate(
  plan, 
  'influencer_xyz', 
  'q4_campaign'
)
```

#### 🎁 Codes Promo
```typescript
// Promotion Black Friday
const promoLink = marketingLinks.promoCode(
  plan, 
  'BLACKFRIDAY50', 
  'black_friday_2024'
)

// Code de réduction
const discountLink = marketingLinks.promoCode(
  plan, 
  'SAVE20', 
  'spring_promotion'
)
```

#### 🎯 Landing Pages
```typescript
// Page de destination SEO
const landingLink = marketingLinks.landingPage(
  plan, 
  'streaming_solutions', 
  'seo'
)

// Page campagne spécifique
const campaignLanding = marketingLinks.landingPage(
  plan, 
  'enterprise_demo', 
  'webinar'
)
```

## 📊 Tracking et Analytics

### API de Tracking

#### Enregistrer une Attribution
```typescript
POST /api/marketing/track
{
  "planId": "507f1f77bcf86cd799439011",
  "planName": "Standard",
  "planPrice": "120,99€",
  "planPeriod": "12 mois",
  "utm_source": "email",
  "utm_medium": "email",
  "utm_campaign": "welcome_series",
  "utm_content": "standard",
  "campaign_id": "email_001",
  "conversionType": "signup_started"
}
```

#### Récupérer les Statistiques
```typescript
GET /api/marketing/track?utm_source=email&start_date=2024-01-01
```

### Données Trackées

#### Paramètres UTM
- **utm_source** : Source du trafic (email, facebook, google, etc.)
- **utm_medium** : Type de média (email, social, cpc, etc.)
- **utm_campaign** : Nom de la campagne
- **utm_content** : Contenu spécifique (nom du plan)
- **utm_term** : Mot-clé (pour les ads)

#### Paramètres Personnalisés
- **campaign_id** : ID unique de la campagne
- **affiliate_id** : ID du partenaire affilié
- **promo_code** : Code promotionnel utilisé
- **referrer** : Page de référence

#### Métadonnées
- **userAgent** : Navigateur de l'utilisateur
- **ipAddress** : Adresse IP
- **timestamp** : Horodatage précis
- **conversionType** : Type de conversion
- **conversionValue** : Valeur de la conversion

## 🎯 Cas d'Usage Marketing

### 1. Campagne Email Newsletter
```typescript
// Générer le lien
const link = marketingLinks.emailCampaign(
  standardPlan, 
  'monthly_newsletter', 
  'december_2024'
)

// Utiliser dans l'email
<a href="${link}">Choisir le plan Standard</a>
```

### 2. Post Réseaux Sociaux
```typescript
// Générer le lien pour Instagram
const link = marketingLinks.socialMedia(
  proPlan, 
  'instagram', 
  'post_new_features'
)

// Bio Instagram ou story
"Découvrez nos nouvelles fonctionnalités 👆 ${link}"
```

### 3. Campagne Google Ads
```typescript
// Générer le lien pour une annonce
const link = marketingLinks.paidAds(
  starterPlan, 
  'google', 
  'ad_streaming_solution', 
  'plateforme streaming'
)

// URL de destination de l'annonce
```

### 4. Programme d'Affiliation
```typescript
// Générer le lien pour un partenaire
const link = marketingLinks.affiliate(
  standardPlan, 
  'partner_techblog', 
  'review_campaign'
)

// Fournir au partenaire pour ses articles/reviews
```

### 5. Code Promo
```typescript
// Générer le lien avec code promo
const link = marketingLinks.promoCode(
  proPlan, 
  'LAUNCH50', 
  'product_launch'
)

// Utiliser dans les communications promotionnelles
```

## 📈 Reporting et Analytics

### Métriques Disponibles

#### Par Source
```javascript
{
  "email": { "count": 150, "value": 18000 },
  "facebook": { "count": 89, "value": 10680 },
  "google": { "count": 234, "value": 28080 }
}
```

#### Par Campagne
```javascript
{
  "welcome_series": { "count": 67, "value": 8040 },
  "monthly_newsletter": { "count": 45, "value": 5400 },
  "black_friday": { "count": 123, "value": 14760 }
}
```

#### Par Plan
```javascript
{
  "Standard": { "count": 89, "value": 10680 },
  "Pro": { "count": 45, "value": 8955 },
  "Starter": { "count": 156, "value": 2340 }
}
```

### Requêtes d'Analyse

#### Conversions par Période
```typescript
GET /api/marketing/track?start_date=2024-01-01&end_date=2024-01-31
```

#### Performance d'une Campagne
```typescript
GET /api/marketing/track?utm_campaign=welcome_series
```

#### ROI par Source
```typescript
GET /api/marketing/track?utm_source=google&utm_medium=cpc
```

## 🛠️ Intégration

### Dans les Composants React
```typescript
import { marketingLinks } from '@/lib/marketing-links'

function PricingCard({ plan }) {
  const handleSelectPlan = () => {
    const link = marketingLinks.landingPage(
      plan, 
      'pricing_page', 
      'website'
    )
    window.location.href = link
  }

  return (
    <button onClick={handleSelectPlan}>
      Choisir {plan.name}
    </button>
  )
}
```

### Dans les Emails
```html
<!-- Template email -->
<a href="{{signupLink}}" style="...">
  Commencer avec {{planName}}
</a>
```

```typescript
// Génération côté serveur
const signupLink = marketingLinks.emailCampaign(
  plan, 
  'welcome_email', 
  emailId
)
```

### Dans les Landing Pages
```typescript
// Page de destination avec attribution
export default function LandingPage({ searchParams }) {
  const planId = searchParams.plan_id
  const utmSource = searchParams.utm_source
  
  // Utiliser les paramètres pour personnaliser l'expérience
}
```

## 🔧 Configuration

### Variables d'Environnement
```env
# URL de base pour les liens
NEXT_PUBLIC_BASE_URL=https://vistream.com

# Base de données pour le tracking
MONGODB_URI=mongodb://...
```

### Paramètres par Défaut
```typescript
// Dans marketing-links.ts
const defaultParams = {
  utm_medium: 'website',
  utm_campaign: 'plan_selection'
}
```

## 📋 Scripts Utiles

### Tester la Génération de Liens
```bash
npm run test:marketing-links
```

### Analyser les Conversions
```bash
# Créer un script personnalisé
node scripts/analyze-conversions.js
```

## 🎯 Bonnes Pratiques

### 1. Nommage des Campagnes
- **Cohérent** : Utilisez une convention de nommage claire
- **Descriptif** : `welcome_series_2024` plutôt que `ws1`
- **Hiérarchique** : `email_welcome_series_part1`

### 2. Paramètres UTM
- **utm_source** : Plateforme exacte (facebook, google, newsletter)
- **utm_medium** : Type de média (email, social, cpc, organic)
- **utm_campaign** : Nom de campagne unique
- **utm_content** : Variante ou plan spécifique

### 3. Tracking des Conversions
- **Étapes multiples** : signup_started → signup_completed → subscription_created
- **Valeurs** : Attribuez des valeurs monétaires aux conversions
- **Nettoyage** : Supprimez les données de test régulièrement

### 4. Analyse et Optimisation
- **ROI par source** : Identifiez les canaux les plus rentables
- **A/B testing** : Testez différents messages/offres
- **Attribution** : Analysez le parcours complet du client

## 🚀 Exemples Complets

### Campagne de Lancement Produit
```typescript
// 1. Email d'annonce
const emailLink = marketingLinks.emailCampaign(
  newPlan, 
  'product_launch_announcement', 
  'launch_email_001'
)

// 2. Posts sociaux
const socialLinks = {
  facebook: marketingLinks.socialMedia(newPlan, 'facebook', 'launch_post'),
  twitter: marketingLinks.socialMedia(newPlan, 'twitter', 'launch_tweet'),
  linkedin: marketingLinks.socialMedia(newPlan, 'linkedin', 'launch_article')
}

// 3. Campagne publicitaire
const adLinks = {
  google: marketingLinks.paidAds(newPlan, 'google', 'launch_ad_001', 'nouveau produit'),
  facebook: marketingLinks.paidAds(newPlan, 'facebook', 'launch_ad_002', 'innovation')
}

// 4. Partenaires
const partnerLinks = partners.map(partner => 
  marketingLinks.affiliate(newPlan, partner.id, 'product_launch')
)
```

### Promotion Saisonnière
```typescript
// Code promo Black Friday
const promoLinks = plans.map(plan => 
  marketingLinks.promoCode(plan, 'BLACKFRIDAY50', 'black_friday_2024')
)

// Landing page dédiée
const landingLink = marketingLinks.landingPage(
  featuredPlan, 
  'black_friday_special', 
  'promotion'
)
```

---

**Dernière mise à jour** : Décembre 2024  
**Version** : 1.0  
**Statut** : ✅ Implémenté et testé 