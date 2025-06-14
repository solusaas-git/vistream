'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { motion } from 'framer-motion'
import PricingSection from '@/components/PricingSection'
import { 
  Zap, 
  Brain, 
  Shield, 
  Globe, 
  BarChart3, 
  Plug,
  Quote,
  Star,
  Check,
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  Loader2,
  Search,
  HelpCircle,
  TrendingUp,
  Lock,
  Server,
  Code,
  Sparkles,
  Volume2,
  Languages,
  Scissors,
  Gauge,
  Eye,
  Activity,
  Target,
  Users,
  DollarSign,
  Key,
  UserCheck,
  AlertTriangle,
  FileCheck,
  Rocket
} from 'lucide-react'

const contactSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  email: z.string().email("Veuillez entrer une adresse email valide."),
  subject: z.string().min(5, "L'objet doit contenir au moins 5 caractères."),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères."),
})

type ContactFormValues = z.infer<typeof contactSchema>

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  
  const videos = [
    '/video-1.mp4',
    '/video-2.mp4',
    '/video-3.mp4',
    '/video-4.mp4',
    '/video-5.mp4'
  ]

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "", email: "", subject: "", message: "",
    },
  })

  async function onSubmit(data: ContactFormValues) {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'envoi du message')
      }

      console.log('Contact message sent:', result)
      setIsSubmitted(true)
      form.reset()
    } catch (error) {
      console.error('Error submitting form:', error)
      // You could add toast notification here
      alert(error instanceof Error ? error.message : 'Erreur lors de l\'envoi du message')
    } finally {
      setIsSubmitting(false)
    }
  }

  const advantages = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: "Upscaling 8K IA",
      description: "Moteur neuronal pour des vidéos plus nettes"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Chapitrage automatique",
      description: "IA générative pour la découverte de contenu"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Analytics prédictifs",
      description: "Heatmaps et alertes de churn en temps réel"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Sécurité DRM",
      description: "Chiffrement E2E et restriction IP"
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Diffusion Multi-CDN",
      description: "6 nœuds globaux, 99,9% d'uptime"
    },
    {
      icon: <Plug className="h-6 w-6" />,
      title: "API & Webhooks",
      description: "Intégration OBS, vMix, Zoom, LMS"
    }
  ]

  const features = [
    {
      id: 'ai-analysis',
      title: 'Analyse IA',
      icon: <Brain className="h-5 w-5" />,
      description: 'Intelligence artificielle avancée pour optimiser vos contenus',
      items: [
        { 
          icon: <Sparkles className="h-5 w-5 text-blue-500" />, 
          title: 'Upscaling 8K adaptatif', 
          description: 'Amélioration automatique jusqu\'à 8K avec préservation des détails',
          details: 'Algorithmes de super-résolution basés sur des réseaux de neurones convolutifs. Détection automatique de la qualité source et optimisation en temps réel.'
        },
        { 
          icon: <Volume2 className="h-5 w-5 text-purple-500" />, 
          title: 'Suppression du bruit avancée', 
          description: 'Deep learning pour netteté optimale et réduction d\'artefacts',
          details: 'IA entraînée sur millions d\'heures de contenu. Suppression intelligente du grain, flou de mouvement et compression artifacts.'
        },
        { 
          icon: <Languages className="h-5 w-5 text-indigo-500" />, 
          title: 'Sous-titres 200+ langues', 
          description: 'Génération automatique multilingue avec synchronisation parfaite',
          details: 'Reconnaissance vocale neuronale avec détection des locuteurs. Traduction automatique et synchronisation labiale pour 200+ langues.'
        },
        { 
          icon: <Scissors className="h-5 w-5 text-green-500" />, 
          title: 'Chapitrage intelligent', 
          description: 'Découpage automatique basé sur l\'analyse de contenu',
          details: 'Détection des changements de scène, transitions et sujets. Génération de titres descriptifs et timestamps précis.'
        },
        { 
          icon: <Gauge className="h-5 w-5 text-orange-500" />, 
          title: 'Optimisation de compression', 
          description: 'Réduction de 40% de la bande passante sans perte de qualité',
          details: 'Algorithmes de compression perceptuelle. Analyse des zones d\'intérêt pour allocation dynamique des bits.'
        },
        { 
          icon: <Eye className="h-5 w-5 text-pink-500" />, 
          title: 'Détection de contenu sensible', 
          description: 'Modération automatique et classification de contenu',
          details: 'IA de vision par ordinateur pour détecter violence, nudité, contenu inapproprié. Système de scoring et alertes automatiques.'
        }
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      description: 'Insights prédictifs et analytics temps réel pour maximiser l\'engagement',
      items: [
        { 
          icon: <Eye className="h-5 w-5 text-blue-500" />, 
          title: 'Heatmaps d\'attention avancées', 
          description: 'Zones les plus regardées avec analyse comportementale',
          details: 'Tracking oculaire virtuel et analyse des patterns de visionnage. Cartes de chaleur en temps réel avec segmentation démographique.'
        },
        { 
          icon: <AlertTriangle className="h-5 w-5 text-green-500" />, 
          title: 'Prédiction d\'abandon intelligente', 
          description: 'IA pour détecter le churn avant qu\'il n\'arrive',
          details: 'Machine learning sur 50+ métriques comportementales. Alertes proactives et recommandations d\'optimisation de contenu.'
        },
        { 
          icon: <Target className="h-5 w-5 text-orange-500" />, 
          title: 'Insights automatiques', 
          description: 'Recommandations IA pour optimiser vos performances',
          details: 'Analyse comparative avec benchmarks sectoriels. Suggestions d\'amélioration basées sur les meilleures pratiques.'
        },
        { 
          icon: <Users className="h-5 w-5 text-purple-500" />, 
          title: 'Segmentation d\'audience', 
          description: 'Groupes automatiques basés sur le comportement de visionnage',
          details: 'Clustering ML pour identifier les profils types. Personnalisation du contenu et recommandations ciblées par segment.'
        },
        { 
          icon: <DollarSign className="h-5 w-5 text-green-500" />, 
          title: 'ROI et attribution', 
          description: 'Mesure précise de la performance commerciale de vos vidéos',
          details: 'Attribution multi-touch des conversions. Optimisation automatique des emplacements publicitaires et pricing dynamique.'
        },
        { 
          icon: <TrendingUp className="h-5 w-5 text-blue-500" />, 
          title: 'Prédictions de tendances', 
          description: 'Anticipation des pics d\'audience et contenus viraux',
          details: 'Modèles prédictifs basés sur l\'historique et les signaux externes. Alertes de tendances émergentes et recommandations de contenu.'
        }
      ]
    },
    {
      id: 'security',
      title: 'Sécurité',
      icon: <Shield className="h-5 w-5" />,
      description: 'Protection enterprise avec DRM et chiffrement de bout en bout',
      items: [
        { 
          icon: <Lock className="h-5 w-5 text-red-500" />, 
          title: 'DRM Multi-plateforme', 
          description: 'Widevine, PlayReady, FairPlay pour une protection maximale',
          details: 'Chiffrement hardware-backed sur tous les devices. Protection contre la capture d\'écran et les outils de téléchargement.'
        },
        { 
          icon: <Key className="h-5 w-5 text-orange-500" />, 
          title: 'Chiffrement AES-256', 
          description: 'Sécurisation militaire de vos contenus en transit et au repos',
          details: 'Clés de chiffrement rotatives et gestion HSM. Conformité FIPS 140-2 Level 3 pour les environnements critiques.'
        },
        { 
          icon: <UserCheck className="h-5 w-5 text-green-500" />, 
          title: 'Authentification avancée', 
          description: 'SSO, 2FA, et contrôle d\'accès granulaire par contenu',
          details: 'Intégration SAML, OAuth 2.0, et Active Directory. Gestion des rôles et permissions par utilisateur ou groupe.'
        },
        { 
          icon: <Globe className="h-5 w-5 text-blue-500" />, 
          title: 'Géo-restriction intelligente', 
          description: 'Contrôle précis de la diffusion par pays et région',
          details: 'Détection IP avancée avec base de données géographique mise à jour en temps réel. Gestion des VPN et proxies.'
        },
        { 
          icon: <Activity className="h-5 w-5 text-purple-500" />, 
          title: 'Monitoring de sécurité', 
          description: 'Détection d\'intrusion et alertes en temps réel',
          details: 'IA de détection d\'anomalies comportementales. Logs forensiques et intégration SIEM pour audit de sécurité.'
        },
        { 
          icon: <FileCheck className="h-5 w-5 text-indigo-500" />, 
          title: 'Conformité réglementaire', 
          description: 'RGPD, SOC 2, ISO 27001 pour vos exigences compliance',
          details: 'Audits de sécurité réguliers et certifications maintenues. Documentation complète pour vos audits internes.'
        }
      ]
    },
    {
      id: 'infrastructure',
      title: 'Infrastructure',
      icon: <Server className="h-5 w-5" />,
      description: 'CDN global et infrastructure cloud auto-scalable',
      items: [
        { 
          icon: <Globe className="h-5 w-5 text-blue-500" />, 
          title: 'CDN 6 continents', 
          description: 'Points de présence optimisés pour une latence minimale',
          details: 'Serveurs edge dans 50+ pays avec routage intelligent. Mise en cache adaptative et pré-positionnement de contenu.'
        },
        { 
          icon: <Zap className="h-5 w-5 text-yellow-500" />, 
          title: 'Auto-scaling intelligent', 
          description: 'Adaptation automatique aux pics de trafic',
          details: 'Provisioning dynamique basé sur l\'IA prédictive. Gestion automatique de la charge avec 0 downtime.'
        },
        { 
          icon: <Activity className="h-5 w-5 text-green-500" />, 
          title: 'SLA 99,99% uptime', 
          description: 'Garantie de disponibilité avec redondance multi-zones',
          details: 'Architecture multi-cloud avec failover automatique. Monitoring 24/7 et intervention proactive en cas d\'incident.'
        },
        { 
          icon: <Gauge className="h-5 w-5 text-purple-500" />, 
          title: 'Optimisation bande passante', 
          description: 'Compression intelligente et streaming adaptatif',
          details: 'Algorithmes de compression perceptuelle. Adaptation automatique de la qualité selon la connexion utilisateur.'
        },
        { 
          icon: <Code className="h-5 w-5 text-orange-500" />, 
          title: 'APIs RESTful complètes', 
          description: 'Intégration facile avec vos systèmes existants',
          details: 'Documentation OpenAPI 3.0 complète. SDKs disponibles en 10+ langages avec exemples de code.'
        },
        { 
          icon: <Plug className="h-5 w-5 text-indigo-500" />, 
          title: 'Webhooks temps réel', 
          description: 'Notifications instantanées pour tous les événements',
          details: 'Système de webhooks fiable avec retry automatique. Filtrage avancé et transformation de payload personnalisable.'
        }
      ]
    }
  ]

  const faqs = [
    { 
      id: 'resolution', 
      question: 'Quelle résolution maximale ?', 
      answer: 'Vistream supporte jusqu\'à la résolution 8K (7680x4320) pour le streaming et l\'upscaling IA. Notre technologie d\'intelligence artificielle peut améliorer automatiquement vos vidéos jusqu\'à cette résolution, même si votre source est en qualité inférieure. Le processus d\'upscaling utilise des algorithmes de deep learning entraînés sur des millions d\'heures de contenu vidéo pour préserver les détails et améliorer la netteté. Nous supportons également tous les formats standards : 4K, 2K, Full HD, HD, et même les anciennes résolutions pour une compatibilité maximale.' 
    },
    { 
      id: 'monetization', 
      question: 'Puis-je monétiser mes vidéos ?', 
      answer: 'Absolument ! Vistream offre une suite complète de monétisation avec notre SDK paywall intégré. Vous pouvez configurer des abonnements récurrents, des paiements uniques, des locations de contenu, et même du pay-per-view. Nous supportons Stripe, PayPal, et plus de 15 passerelles de paiement internationales. Notre système inclut la gestion des taxes automatique, les remboursements, les coupons de réduction, et des analytics détaillés sur vos revenus. Vous gardez 95% de vos revenus (5% de commission Vistream), ce qui est parmi les taux les plus compétitifs du marché.' 
    },
    { 
      id: 'payment', 
      question: 'Quelles cartes bancaires acceptées ?', 
      answer: 'Nous acceptons toutes les principales cartes bancaires : Visa, Mastercard, American Express, Discover, JCB, et Diners Club. Les paiements sont sécurisés via Stripe (certifié PCI DSS Level 1) avec chiffrement SSL 256-bit. Nous supportons également les portefeuilles numériques comme Apple Pay, Google Pay, et PayPal. Pour les entreprises, nous acceptons les virements bancaires SEPA, les chèques, et pouvons établir des facturations personnalisées. Tous les paiements sont traités en temps réel avec confirmation instantanée.' 
    },
    { 
      id: 'live-integrations', 
      question: 'Quelles intégrations live ?', 
      answer: 'Vistream s\'intègre parfaitement avec tous les logiciels de streaming populaires : OBS Studio, vMix, Wirecast, XSplit, et Zoom. Notre plateforme supporte les protocoles RTMP, RTMPS, SRT, et WebRTC pour une flexibilité maximale. Nous offrons également des APIs REST et des webhooks pour des intégrations personnalisées. Pour les entreprises, nous proposons des connecteurs directs avec les systèmes LMS (Moodle, Canvas), CRM (Salesforce, HubSpot), et plateformes e-learning. Notre équipe technique peut vous accompagner dans la configuration et fournir un support dédié pour vos intégrations spécifiques.' 
    },
    { 
      id: 'concurrent-users', 
      question: 'Combien d\'utilisateurs simultanés ?', 
      answer: 'Il n\'y a aucune limite technique sur le nombre d\'utilisateurs simultanés ! Notre infrastructure cloud auto-scalable peut gérer de 10 à 10 millions de viewers simultanés. Nous utilisons un réseau CDN global avec 6 points de présence (Paris, Londres, New York, Tokyo, Sydney, São Paulo) pour garantir une latence minimale partout dans le monde. Le seul facteur limitant est votre forfait de bande passante. Notre système de load balancing intelligent répartit automatiquement la charge et active des serveurs supplémentaires en cas de pic d\'audience. Nous garantissons 99,9% d\'uptime avec SLA.' 
    },
    { 
      id: 'plan-upgrade', 
      question: 'Puis-je upgrader de Starter à Pro ?', 
      answer: 'Oui, vous pouvez changer de plan à tout moment ! Le calcul se fait au prorata : vous payez uniquement la différence pour la période restante de votre abonnement actuel. Par exemple, si vous upgradez de Starter (15€/mois) vers Pro (199€/24mois) après 15 jours, nous calculons le crédit restant et ajustons votre facturation. L\'upgrade est instantané - vous accédez immédiatement aux nouvelles fonctionnalités (stockage supplémentaire, analytics IA, support prioritaire). Vous pouvez également downgrader, mais les données excédentaires seront archivées. Notre équipe support peut vous conseiller sur le meilleur moment pour changer de plan selon votre usage.' 
    },
    { 
      id: 'security', 
      question: 'Quelle sécurité pour mes contenus ?', 
      answer: 'La sécurité est notre priorité absolue. Tous vos contenus sont chiffrés avec AES-256 en transit et au repos. Nous utilisons un système DRM multi-plateforme (Widevine, PlayReady, FairPlay) pour protéger vos vidéos premium contre le piratage. Notre infrastructure inclut la détection d\'intrusion, les firewalls applicatifs, et la surveillance 24/7. Nous sommes conformes RGPD, SOC 2 Type II, et ISO 27001. Vos données sont hébergées dans des datacenters certifiés avec redondance géographique. Nous proposons également l\'authentification multi-facteurs, la restriction géographique, et le watermarking forensique pour identifier les fuites.' 
    },
    { 
      id: 'analytics', 
      question: 'Quels analytics sont disponibles ?', 
      answer: 'Vistream offre les analytics les plus avancés du marché grâce à notre IA propriétaire. Vous obtenez des métriques en temps réel : viewers simultanés, temps de visionnage, taux de rétention, heatmaps d\'attention, et prédictions de churn. Notre IA analyse le comportement des utilisateurs pour identifier les moments clés, suggérer des améliorations de contenu, et prédire les abandons avant qu\'ils n\'arrivent. Nous fournissons des rapports détaillés par démographie, géolocalisation, device, et source de trafic. Les données sont exportables en CSV, PDF, ou via API pour vos propres outils de BI. Tableau de bord personnalisable avec alertes automatiques.' 
    }
  ]

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen">
      {/* HERO SECTION */}
      <section id="hero" className="relative h-screen flex items-center justify-center text-white overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 z-0">
          <video
            key={currentVideoIndex}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
            onEnded={() => {
              setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videos.length)
            }}
          >
            <source src={videos[currentVideoIndex]} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/60"></div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 to-slate-700/70"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Streaming vidéo 100% IA
            </h1>
            <p className="text-xl md:text-2xl mb-10 text-slate-100 max-w-3xl mx-auto leading-relaxed">
              Diffusez, analysez et monétisez vos vidéos en quelques clics. 
              Notre IA améliore la qualité et prédit l'engagement.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4 shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => {
                  const element = document.querySelector('#pricing')
                  if (element) {
                    const offset = 80
                    const elementPosition = element.getBoundingClientRect().top
                    const offsetPosition = elementPosition + window.pageYOffset - offset
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
                  }
                }}
              >
                <Rocket className="h-5 w-5 mr-2" />
                Commencer maintenant
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white text-white hover:bg-white hover:text-slate-900 text-lg px-8 py-4 backdrop-blur-sm bg-white/10 transition-all duration-300"
                onClick={() => {
                  const element = document.querySelector('#pricing')
                  if (element) {
                    const offset = 80
                    const elementPosition = element.getBoundingClientRect().top
                    const offsetPosition = elementPosition + window.pageYOffset - offset
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
                  }
                }}
              >
                Voir les tarifs
              </Button>
            </div>

            {/* Ultra-Elegant Feature Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 60, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  scale: 1
                }}
                transition={{ 
                  opacity: { duration: 1, delay: 0.2 },
                  y: { duration: 1, delay: 0.2 },
                  scale: { duration: 1, delay: 0.2 }
                }}
                whileHover={{ 
                  scale: 1.08, 
                  y: -12,
                  rotateY: 5,
                  rotateX: 5
                }}
                className="group relative bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 text-center border border-white/30 hover:border-white/50 transition-all duration-500 shadow-2xl hover:shadow-blue-500/20"
                              >
                <motion.div
                  animate={{ 
                    y: [0, -6, 0], 
                    scale: [1, 1.01, 1] 
                  }}
                  transition={{ 
                    y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.2 },
                    scale: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.2 }
                  }}
                  className="w-full h-full relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.6 }}
                    className="relative w-16 h-16 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:shadow-blue-500/40"
                  >
                    <Brain className="w-8 h-8 text-white drop-shadow-lg" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-2xl"></div>
                  </motion.div>
                  <h3 className="font-bold text-white text-base mb-2 tracking-wide">IA Upscaling</h3>
                  <p className="text-white/80 text-sm font-medium">Amélioration 8K</p>
                  <div className="absolute top-2 right-2 w-2 h-2 bg-blue-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 60, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  scale: 1
                }}
                transition={{ 
                  opacity: { duration: 1, delay: 0.4 },
                  y: { duration: 1, delay: 0.4 },
                  scale: { duration: 1, delay: 0.4 }
                }}
                whileHover={{ 
                  scale: 1.08, 
                  y: -12,
                  rotateY: 5,
                  rotateX: 5
                }}
                className="group relative bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 text-center border border-white/30 hover:border-white/50 transition-all duration-500 shadow-2xl hover:shadow-green-500/20"
              >
                <motion.div
                  animate={{ 
                    y: [0, -6, 0], 
                    scale: [1, 1.01, 1] 
                  }}
                  transition={{ 
                    y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2.4 },
                    scale: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2.4 }
                  }}
                  className="w-full h-full relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.6 }}
                    className="relative w-16 h-16 bg-gradient-to-br from-green-400 via-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:shadow-green-500/40"
                  >
                    <BarChart3 className="w-8 h-8 text-white drop-shadow-lg" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-2xl"></div>
                  </motion.div>
                  <h3 className="font-bold text-white text-base mb-2 tracking-wide">Analytics</h3>
                  <p className="text-white/80 text-sm font-medium">Insights Prédictifs</p>
                  <div className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 60, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  scale: 1
                }}
                transition={{ 
                  opacity: { duration: 1, delay: 0.6 },
                  y: { duration: 1, delay: 0.6 },
                  scale: { duration: 1, delay: 0.6 }
                }}
                whileHover={{ 
                  scale: 1.08, 
                  y: -12,
                  rotateY: 5,
                  rotateX: 5
                }}
                className="group relative bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 text-center border border-white/30 hover:border-white/50 transition-all duration-500 shadow-2xl hover:shadow-purple-500/20"
              >
                <motion.div
                  animate={{ 
                    y: [0, -6, 0], 
                    scale: [1, 1.01, 1] 
                  }}
                  transition={{ 
                    y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 3.6 },
                    scale: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 3.6 }
                  }}
                  className="w-full h-full relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-violet-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.6 }}
                    className="relative w-16 h-16 bg-gradient-to-br from-purple-400 via-purple-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:shadow-purple-500/40"
                  >
                    <Shield className="w-8 h-8 text-white drop-shadow-lg" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-2xl"></div>
                  </motion.div>
                  <h3 className="font-bold text-white text-base mb-2 tracking-wide">Sécurité</h3>
                  <p className="text-white/80 text-sm font-medium">DRM Enterprise</p>
                  <div className="absolute top-2 right-2 w-2 h-2 bg-purple-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 60, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  scale: 1
                }}
                transition={{ 
                  opacity: { duration: 1, delay: 0.8 },
                  y: { duration: 1, delay: 0.8 },
                  scale: { duration: 1, delay: 0.8 }
                }}
                whileHover={{ 
                  scale: 1.08, 
                  y: -12,
                  rotateY: 5,
                  rotateX: 5
                }}
                className="group relative bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 text-center border border-white/30 hover:border-white/50 transition-all duration-500 shadow-2xl hover:shadow-cyan-500/20"
              >
                <motion.div
                  animate={{ 
                    y: [0, -6, 0], 
                    scale: [1, 1.01, 1] 
                  }}
                  transition={{ 
                    y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 4.8 },
                    scale: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 4.8 }
                  }}
                  className="w-full h-full relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-teal-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.6 }}
                    className="relative w-16 h-16 bg-gradient-to-br from-cyan-400 via-cyan-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:shadow-cyan-500/40"
                  >
                    <Globe className="w-8 h-8 text-white drop-shadow-lg" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-2xl"></div>
                  </motion.div>
                  <h3 className="font-bold text-white text-base mb-2 tracking-wide">Global CDN</h3>
                  <p className="text-white/80 text-sm font-medium">99.9% Uptime</p>
                  <div className="absolute top-2 right-2 w-2 h-2 bg-cyan-400 rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300"></div>
                </motion.div>
              </motion.div>
            </div>

            {/* Subtle animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"
              />
              <motion.div
                animate={{ 
                  scale: [1.2, 1, 1.2],
                  opacity: [0.1, 0.2, 0.1]
                }}
                transition={{ duration: 6, repeat: Infinity, delay: 2 }}
                className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-500/10 rounded-full blur-xl"
              />
              <motion.div
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.05, 0.15, 0.05]
                }}
                transition={{ duration: 10, repeat: Infinity, delay: 4 }}
                className="absolute top-1/2 right-1/3 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl"
              />
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-10">
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-white/70 cursor-pointer"
            onClick={() => {
              const element = document.querySelector('#advantages')
              if (element) {
                const offset = 80
                const elementPosition = element.getBoundingClientRect().top
                const offsetPosition = elementPosition + window.pageYOffset - offset
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
              }
            }}
          >
            <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            <span className="block text-xs">Découvrir</span>
          </motion.div>
        </div>
      </section>

      {/* ADVANTAGES SECTION */}
      <section id="advantages" className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Pourquoi Vistream ?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Plateforme de streaming vidéo alimentée par l'IA
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {advantages.map((advantage, index) => {
              const colorSchemes = [
                {
                  // IA Upscaling - Bleu
                  bg: "bg-gradient-to-br from-blue-50 to-indigo-100",
                  border: "border-blue-200 hover:border-blue-300",
                  iconBg: "bg-blue-500",
                  iconColor: "text-white"
                },
                {
                  // Chapitrage - Vert
                  bg: "bg-gradient-to-br from-green-50 to-emerald-100",
                  border: "border-green-200 hover:border-green-300",
                  iconBg: "bg-green-500",
                  iconColor: "text-white"
                },
                {
                  // Analytics - Orange
                  bg: "bg-gradient-to-br from-orange-50 to-amber-100",
                  border: "border-orange-200 hover:border-orange-300",
                  iconBg: "bg-orange-500",
                  iconColor: "text-white"
                },
                {
                  // Sécurité - Rouge
                  bg: "bg-gradient-to-br from-red-50 to-rose-100",
                  border: "border-red-200 hover:border-red-300",
                  iconBg: "bg-red-500",
                  iconColor: "text-white"
                },
                {
                  // CDN - Violet
                  bg: "bg-gradient-to-br from-purple-50 to-violet-100",
                  border: "border-purple-200 hover:border-purple-300",
                  iconBg: "bg-purple-500",
                  iconColor: "text-white"
                },
                {
                  // API - Cyan
                  bg: "bg-gradient-to-br from-cyan-50 to-teal-100",
                  border: "border-cyan-200 hover:border-cyan-300",
                  iconBg: "bg-cyan-500",
                  iconColor: "text-white"
                }
              ]
              
              const scheme = colorSchemes[index % colorSchemes.length]
              
              return (
                <motion.div key={index} variants={itemVariants}>
                  <Card className={`h-full hover:shadow-xl transition-all duration-300 border-2 ${scheme.bg} ${scheme.border} hover:scale-105`}>
                    <CardContent className="p-6">
                      <div className={`inline-flex p-3 rounded-xl ${scheme.iconBg} mb-4 shadow-lg`}>
                        <div className={scheme.iconColor}>{advantage.icon}</div>
                      </div>
                      <h3 className="font-bold text-lg mb-3 text-gray-800">{advantage.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{advantage.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Fonctionnalités IA</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Découvrez nos technologies d'intelligence artificielle
            </p>
          </motion.div>

          <Card className="bg-background/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <Tabs defaultValue="ai-analysis" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                  {features.map((feature) => (
                    <TabsTrigger key={feature.id} value={feature.id} className="flex items-center gap-2">
                      {feature.icon}
                      <span className="hidden sm:inline">{feature.title}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {features.map((feature) => (
                  <TabsContent key={feature.id} value={feature.id} className="mt-0">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {feature.items.map((item, index) => (
                        <Card key={index} className="border-0 bg-muted/50 hover:bg-muted/70 transition-all duration-300 group">
                          <CardContent className="p-6">
                            <div className="flex items-start space-x-4">
                              <div className="flex-shrink-0 p-2 rounded-lg bg-background/80 group-hover:scale-110 transition-transform duration-300">
                                {item.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold mb-2 text-base text-foreground">{item.title}</h4>
                                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{item.description}</p>
                                {(item as any).details && (
                                  <p className="text-xs text-muted-foreground/80 leading-relaxed border-l-2 border-primary/20 pl-3">
                                    {(item as any).details}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SOCIAL PROOF SECTION */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-100">
              <CardContent className="p-8">
                <Quote className="h-8 w-8 text-primary mx-auto mb-4" />
                <blockquote className="text-xl md:text-2xl font-medium mb-4">
                  "Grâce à Vistream, notre taux de rétention vidéo a grimpé de 42%."
                </blockquote>
                <cite className="text-muted-foreground">– Pierre M., EdTech Lyon</cite>
                <div className="flex justify-center items-center mt-6 space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current text-yellow-400" />
                  ))}
                  <span className="ml-2 text-sm font-medium">4,9/5 sur SaaS Reviews</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <PricingSection />

      {/* FAQ SECTION */}
      <section id="faq" className="py-16 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <HelpCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Questions fréquentes</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              Trouvez rapidement les réponses à vos questions
            </p>

            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Rechercher dans les FAQ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card>
              <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqs.map((faq) => (
                    <AccordionItem key={faq.id} value={faq.id} className="border-b last:border-b-0 px-6">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <span className="text-left font-semibold text-sm">
                          {faq.question}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 pt-0">
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {faq.answer}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Contactez-nous</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Notre équipe est là pour répondre à toutes vos questions
            </p>
          </motion.div>

          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-md mx-auto"
            >
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Message envoyé !</h3>
                  <p className="text-muted-foreground mb-4">
                    Notre équipe vous répondra sous 24h.
                  </p>
                  <Button onClick={() => setIsSubmitted(false)} variant="outline">
                    Nouveau message
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Envoyer un message</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nom</FormLabel>
                              <FormControl>
                                <Input placeholder="Jean Dupont" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="jean@exemple.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Objet</FormLabel>
                            <FormControl>
                              <Input placeholder="Demande d'information" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Décrivez votre projet..."
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Envoi en cours...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Envoyer le message
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Informations de contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">Adresse</p>
                      <p className="text-sm text-muted-foreground">
                        LT. RADU BELLER NR. 3-5 SECT. 1<br />BUCURESTI SECTORUL 1<br />Roumanie
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Mail className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">Support</p>
                      <p className="text-sm text-muted-foreground">support@vistream.net</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Phone className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">Téléphone</p>
                      <p className="text-sm text-muted-foreground">+33 6 67 31 95 99</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-semibold">Horaires</p>
                      <p className="text-sm text-muted-foreground">
                        Lundi - Vendredi<br />9h00 - 18h00 CET
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>
    </div>
  )
} 