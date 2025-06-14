import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Building, Target, Users, Award, Globe, Zap } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function AboutPage() {
  const values = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Innovation",
      description: "Nous repoussons les limites de la technologie IA pour révolutionner le streaming vidéo."
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Centré Client",
      description: "Chaque décision est prise en pensant à l'expérience et au succès de nos utilisateurs."
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: "Excellence",
      description: "Nous visons la perfection dans chaque aspect de notre plateforme et service."
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Accessibilité",
      description: "Rendre la technologie de streaming IA accessible à tous, partout dans le monde."
    }
  ]

  const milestones = [
    { year: "2024", event: "Lancement de Vistream avec IA d'upscaling 8K", status: "Fondation" },
    { year: "2024", event: "1000+ utilisateurs actifs", status: "Croissance" },
    { year: "2025", event: "Expansion européenne prévue", status: "Futur" }
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
            <Building className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">À propos de Vistream</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Nous révolutionnons le streaming vidéo grâce à l'intelligence artificielle, 
            en rendant la technologie avancée accessible à tous.
          </p>
        </div>

        {/* Mission */}
        <div className="mb-12">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-2xl">
                <Target className="h-6 w-6" />
                <span>Notre Mission</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-lg text-muted-foreground">
                Démocratiser l'accès aux technologies de streaming vidéo les plus avancées en combinant 
                intelligence artificielle, simplicité d'utilisation et performance exceptionnelle.
              </p>
              <p className="text-muted-foreground">
                Nous croyons que chaque créateur, entreprise ou organisation devrait pouvoir diffuser 
                du contenu vidéo de qualité professionnelle sans avoir besoin d'une équipe technique 
                dédiée ou d'un budget conséquent.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Company Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>L'Entreprise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="relative w-12 h-12 flex-shrink-0">
                  <Image
                    src="/logo.svg"
                    alt="Vistream Logo"
                    width={48}
                    height={48}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-semibold">Vistream SRL</h3>
                  <p className="text-sm text-muted-foreground">Société de technologie</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Fondée :</strong> 2024</p>
                <p><strong>Siège social :</strong> Bucarest, Roumanie</p>
                <p><strong>Secteur :</strong> SaaS, Streaming, Intelligence Artificielle</p>
                <p><strong>Employés :</strong> 5-10</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nos Chiffres</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">1000+</div>
                  <div className="text-sm text-muted-foreground">Utilisateurs actifs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">99.9%</div>
                  <div className="text-sm text-muted-foreground">Uptime garanti</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">6</div>
                  <div className="text-sm text-muted-foreground">CDN globaux</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">8K</div>
                  <div className="text-sm text-muted-foreground">Résolution max</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Values */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Nos Valeurs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="inline-flex p-3 bg-primary/10 rounded-full text-primary mb-4">
                    {value.icon}
                  </div>
                  <h3 className="font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Notre Histoire</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                {milestones.map((milestone, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <Badge variant={milestone.status === 'Futur' ? 'outline' : 'default'}>
                        {milestone.year}
                      </Badge>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{milestone.event}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge variant="secondary" className="text-xs">
                        {milestone.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technology */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Notre Technologie</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Intelligence Artificielle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Nos algorithmes propriétaires d'IA permettent l'upscaling automatique jusqu'à 8K, 
                  la génération de sous-titres multilingues, et l'analyse prédictive d'engagement.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Réseaux de neurones convolutifs pour l'upscaling</li>
                  <li>• NLP avancé pour les sous-titres automatiques</li>
                  <li>• Machine learning pour l'analyse comportementale</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Infrastructure Cloud</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Architecture multi-cloud avec CDN global pour garantir des performances 
                  optimales partout dans le monde.
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• AWS, Azure, Google Cloud</li>
                  <li>• 6 points de présence globaux</li>
                  <li>• Auto-scaling et load balancing</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact CTA */}
        <Card className="bg-gradient-to-r from-primary/10 to-blue-50 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold mb-4">Rejoignez l'Aventure</h3>
            <p className="text-muted-foreground mb-6">
              Vous partagez notre vision ? Contactez-nous pour découvrir nos opportunités 
              de carrière ou partenariat.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/careers">
                <Button>Voir les Postes</Button>
              </Link>
              <Link href="/#contact">
                <Button variant="outline">Nous Contacter</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 