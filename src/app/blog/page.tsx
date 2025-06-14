import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, User, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function BlogPage() {
  const articles = [
    {
      id: 1,
      title: "L'IA révolutionne le streaming vidéo : 5 tendances à suivre en 2024",
      excerpt: "Découvrez comment l'intelligence artificielle transforme l'industrie du streaming avec l'upscaling automatique, la génération de sous-titres et l'analyse prédictive.",
      author: "Équipe Vistream",
      date: "15 Décembre 2024",
      readTime: "5 min",
      category: "Technologie",
      featured: true
    },
    {
      id: 2,
      title: "Guide complet : Optimiser la qualité de vos streams en direct",
      excerpt: "Conseils pratiques pour améliorer la qualité de vos diffusions en direct, de la configuration technique aux bonnes pratiques de streaming.",
      author: "Marie Dubois",
      date: "10 Décembre 2024",
      readTime: "8 min",
      category: "Guide",
      featured: false
    },
    {
      id: 3,
      title: "Monétisation vidéo : Stratégies gagnantes pour 2024",
      excerpt: "Explorez les différentes méthodes de monétisation de contenu vidéo et découvrez comment maximiser vos revenus avec les bons outils.",
      author: "Pierre Martin",
      date: "5 Décembre 2024",
      readTime: "6 min",
      category: "Business",
      featured: false
    },
    {
      id: 4,
      title: "Sécurité DRM : Protéger vos contenus premium",
      excerpt: "Comprendre les enjeux de la protection de contenu et les solutions DRM pour sécuriser vos vidéos contre le piratage.",
      author: "Sophie Laurent",
      date: "1 Décembre 2024",
      readTime: "7 min",
      category: "Sécurité",
      featured: false
    },
    {
      id: 5,
      title: "Analytics vidéo : Décrypter le comportement de votre audience",
      excerpt: "Apprenez à utiliser les données d'engagement pour optimiser vos contenus et améliorer l'expérience de vos viewers.",
      author: "Thomas Rousseau",
      date: "28 Novembre 2024",
      readTime: "4 min",
      category: "Analytics",
      featured: false
    },
    {
      id: 6,
      title: "CDN Global : Pourquoi la latence compte dans le streaming",
      excerpt: "L'importance d'un réseau de distribution de contenu performant pour offrir une expérience de streaming optimale à vos utilisateurs.",
      author: "Équipe Vistream",
      date: "25 Novembre 2024",
      readTime: "5 min",
      category: "Infrastructure",
      featured: false
    }
  ]

  const categories = ["Tous", "Technologie", "Guide", "Business", "Sécurité", "Analytics", "Infrastructure"]

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
            <Calendar className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">Blog Vistream</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Actualités, guides et insights sur le streaming vidéo, l'intelligence artificielle 
            et les dernières innovations technologiques.
          </p>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge 
                key={category} 
                variant={category === "Tous" ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        {/* Featured Article */}
        {articles.filter(article => article.featured).map((article) => (
          <Card key={article.id} className="mb-12 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="md:flex">
              <div className="md:w-1/3 bg-gradient-to-br from-blue-500 to-purple-600 p-8 text-white flex items-center justify-center">
                <div className="text-center">
                  <Badge className="bg-white/20 text-white mb-4">Article vedette</Badge>
                  <h3 className="text-xl font-bold">Dernière publication</h3>
                </div>
              </div>
              <div className="md:w-2/3 p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <Badge variant="secondary">{article.category}</Badge>
                  <div className="flex items-center text-sm text-muted-foreground space-x-4">
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>{article.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{article.date}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{article.readTime}</span>
                    </div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold mb-3">{article.title}</h2>
                <p className="text-muted-foreground mb-4">{article.excerpt}</p>
                <Button>
                  Lire l'article
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.filter(article => !article.featured).map((article) => (
            <Card key={article.id} className="hover:shadow-lg transition-shadow duration-300 cursor-pointer group">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{article.category}</Badge>
                  <div className="flex items-center text-xs text-muted-foreground space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{article.readTime}</span>
                  </div>
                </div>
                <CardTitle className="group-hover:text-primary transition-colors">
                  {article.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {article.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs text-muted-foreground space-x-4">
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{article.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{article.date}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Newsletter Signup */}
        <Card className="mt-12 bg-gradient-to-r from-primary/10 to-blue-50 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold mb-4">Restez informé</h3>
            <p className="text-muted-foreground mb-6">
              Recevez nos derniers articles et actualités directement dans votre boîte mail.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Votre adresse email"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <Button>S'abonner</Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Pas de spam, désabonnement en un clic.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 