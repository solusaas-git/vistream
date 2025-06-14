import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Book, Code, Zap, Settings, Play, FileText, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export default function DocsPage() {
  const sections = [
    {
      icon: <Play className="h-6 w-6" />,
      title: "Démarrage Rapide",
      description: "Configurez votre premier stream en 5 minutes",
      articles: [
        { title: "Créer votre compte", time: "2 min", difficulty: "Débutant" },
        { title: "Premier upload de vidéo", time: "3 min", difficulty: "Débutant" },
        { title: "Configuration du streaming live", time: "5 min", difficulty: "Intermédiaire" },
        { title: "Intégration avec OBS Studio", time: "8 min", difficulty: "Intermédiaire" }
      ]
    },
    {
      icon: <Code className="h-6 w-6" />,
      title: "API & Intégrations",
      description: "Documentation technique complète",
      articles: [
        { title: "Authentification API", time: "10 min", difficulty: "Avancé" },
        { title: "Upload via API REST", time: "15 min", difficulty: "Avancé" },
        { title: "Webhooks et événements", time: "12 min", difficulty: "Avancé" },
        { title: "SDK JavaScript", time: "20 min", difficulty: "Avancé" }
      ]
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Fonctionnalités IA",
      description: "Exploitez la puissance de l'intelligence artificielle",
      articles: [
        { title: "Upscaling automatique 8K", time: "6 min", difficulty: "Intermédiaire" },
        { title: "Génération de sous-titres", time: "8 min", difficulty: "Intermédiaire" },
        { title: "Analytics prédictifs", time: "12 min", difficulty: "Avancé" },
        { title: "Détection de contenu", time: "10 min", difficulty: "Avancé" }
      ]
    },
    {
      icon: <Settings className="h-6 w-6" />,
      title: "Configuration Avancée",
      description: "Optimisez vos paramètres pour des performances maximales",
      articles: [
        { title: "Optimisation de la qualité", time: "15 min", difficulty: "Avancé" },
        { title: "Configuration CDN", time: "20 min", difficulty: "Expert" },
        { title: "Sécurité et DRM", time: "18 min", difficulty: "Expert" },
        { title: "Monitoring et alertes", time: "12 min", difficulty: "Avancé" }
      ]
    }
  ]

  const quickLinks = [
    {
      title: "Référence API",
      description: "Documentation complète de l'API REST",
      icon: <Code className="h-5 w-5" />,
      link: "/api",
      external: false
    },
    {
      title: "Exemples de Code",
      description: "Snippets et exemples d'intégration",
      icon: <FileText className="h-5 w-5" />,
      link: "https://github.com/vistream/examples",
      external: true
    },
    {
      title: "Postman Collection",
      description: "Testez l'API directement",
      icon: <ExternalLink className="h-5 w-5" />,
      link: "https://postman.com/vistream",
      external: true
    }
  ]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Débutant': return 'bg-green-100 text-green-800'
      case 'Intermédiaire': return 'bg-yellow-100 text-yellow-800'
      case 'Avancé': return 'bg-orange-100 text-orange-800'
      case 'Expert': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-background py-16 pt-32">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-12">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
          <div className="flex items-center space-x-3 mb-4">
            <Book className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">Documentation</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Guides complets, références API et tutoriels pour maîtriser toutes les fonctionnalités de Vistream.
          </p>
        </div>

        {/* Quick Links */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Liens Rapides</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickLinks.map((link, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {link.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{link.title}</h3>
                      {link.external && <ExternalLink className="h-4 w-4 text-muted-foreground inline ml-1" />}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{link.description}</p>
                  <Button variant="outline" size="sm" className="w-full">
                    Accéder
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Documentation Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    {section.icon}
                  </div>
                  <div>
                    <h3 className="text-xl">{section.title}</h3>
                    <p className="text-sm text-muted-foreground font-normal">{section.description}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.articles.map((article, articleIndex) => (
                    <div 
                      key={articleIndex} 
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-sm">{article.title}</h4>
                        <Badge className={`text-xs ${getDifficultyColor(article.difficulty)}`}>
                          {article.difficulty}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>⏱️ {article.time}</span>
                        <span className="text-primary hover:underline">Lire →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Code Example */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Code className="h-5 w-5" />
                <span>Exemple d'Intégration</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto">
                <pre className="text-sm">
{`// Initialisation du SDK Vistream
import { Vistream } from '@vistream/sdk';

const vistream = new Vistream({
  apiKey: 'your-api-key',
  region: 'eu-west-1'
});

// Upload d'une vidéo avec IA
const upload = await vistream.videos.upload({
  file: videoFile,
  options: {
    aiUpscaling: true,
    autoSubtitles: ['fr', 'en'],
    analytics: true
  }
});

console.log('Video uploaded:', upload.id);`}
                </pre>
              </div>
              <div className="mt-4 flex space-x-3">
                <Button variant="outline" size="sm">
                  <Code className="h-4 w-4 mr-2" />
                  Voir plus d'exemples
                </Button>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  GitHub Repository
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Support CTA */}
        <Card className="mt-12 bg-gradient-to-r from-primary/10 to-blue-50 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold mb-4">Besoin d'Aide ?</h3>
            <p className="text-muted-foreground mb-6">
              Notre équipe technique est disponible pour vous accompagner dans vos intégrations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button>Contacter l'Équipe Technique</Button>
              <Button variant="outline">developers@vistream.net</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 