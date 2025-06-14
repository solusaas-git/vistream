import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, HelpCircle, Search, Book, MessageCircle, Video, Settings, Shield, Zap } from 'lucide-react'
import Link from 'next/link'

export default function HelpPage() {
  const categories = [
    {
      icon: <Video className="h-6 w-6" />,
      title: "Streaming & Upload",
      description: "Configuration, qualité vidéo, formats supportés",
      articles: 12,
      color: "bg-blue-50 text-blue-600 border-blue-200"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "IA & Fonctionnalités",
      description: "Upscaling, sous-titres, analytics prédictifs",
      articles: 8,
      color: "bg-purple-50 text-purple-600 border-purple-200"
    },
    {
      icon: <Settings className="h-6 w-6" />,
      title: "Compte & Facturation",
      description: "Gestion du compte, plans, paiements",
      articles: 15,
      color: "bg-green-50 text-green-600 border-green-200"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Sécurité & DRM",
      description: "Protection de contenu, géo-restriction",
      articles: 6,
      color: "bg-red-50 text-red-600 border-red-200"
    }
  ]

  const popularArticles = [
    {
      title: "Comment configurer OBS Studio avec Vistream",
      category: "Streaming",
      views: "2.5k vues",
      difficulty: "Débutant"
    },
    {
      title: "Optimiser la qualité de vos vidéos avec l'IA",
      category: "IA",
      views: "1.8k vues",
      difficulty: "Intermédiaire"
    },
    {
      title: "Configurer la monétisation de vos contenus",
      category: "Facturation",
      views: "1.2k vues",
      difficulty: "Avancé"
    },
    {
      title: "Résoudre les problèmes de latence",
      category: "Streaming",
      views: "980 vues",
      difficulty: "Intermédiaire"
    },
    {
      title: "Activer la protection DRM",
      category: "Sécurité",
      views: "750 vues",
      difficulty: "Avancé"
    }
  ]

  const quickActions = [
    {
      icon: <MessageCircle className="h-5 w-5" />,
      title: "Chat en Direct",
      description: "Support instantané 24/7",
      action: "Démarrer le chat"
    },
    {
      icon: <Book className="h-5 w-5" />,
      title: "Documentation",
      description: "Guides techniques détaillés",
      action: "Voir la doc"
    },
    {
      icon: <Video className="h-5 w-5" />,
      title: "Tutoriels Vidéo",
      description: "Apprenez en regardant",
      action: "Voir les vidéos"
    }
  ]

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
            <HelpCircle className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">Centre d'Aide</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Trouvez rapidement les réponses à vos questions et apprenez à tirer le meilleur parti de Vistream.
          </p>
        </div>

        {/* Search */}
        <div className="mb-12">
          <Card className="bg-gradient-to-r from-primary/5 to-blue-50">
            <CardContent className="p-8">
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-xl font-semibold mb-4">Comment pouvons-nous vous aider ?</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input 
                    placeholder="Rechercher dans l'aide..."
                    className="pl-10 py-3 text-lg"
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Exemples : "configurer OBS", "upscaling IA", "problème de paiement"
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Support Rapide</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex p-3 bg-primary/10 rounded-full text-primary mb-4">
                    {action.icon}
                  </div>
                  <h3 className="font-semibold mb-2">{action.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{action.description}</p>
                  <Button variant="outline" size="sm">{action.action}</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Parcourir par Catégorie</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((category, index) => (
              <Card key={index} className={`hover:shadow-lg transition-shadow duration-300 cursor-pointer border-2 ${category.color}`}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${category.color}`}>
                      {category.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{category.title}</h3>
                      <p className="text-muted-foreground mb-3">{category.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{category.articles} articles</Badge>
                        <Button variant="ghost" size="sm">Voir tout →</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Popular Articles */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Articles Populaires</h2>
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {popularArticles.map((article, index) => (
                  <div key={index} className="p-6 hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-2 hover:text-primary transition-colors">
                          {article.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">{article.category}</Badge>
                          <span>{article.views}</span>
                          <Badge 
                            variant={article.difficulty === 'Débutant' ? 'default' : 
                                   article.difficulty === 'Intermédiaire' ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {article.difficulty}
                          </Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Lire →</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Support */}
        <Card className="bg-gradient-to-r from-primary/10 to-blue-50 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold mb-4">Vous ne trouvez pas ce que vous cherchez ?</h3>
            <p className="text-muted-foreground mb-6">
              Notre équipe support est là pour vous aider. Contactez-nous directement pour une assistance personnalisée.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button>
                <MessageCircle className="h-4 w-4 mr-2" />
                Contacter le Support
              </Button>
              <Button variant="outline">support@vistream.net</Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              Temps de réponse moyen : 2 heures • Support 24/7 disponible
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 