import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Briefcase, MapPin, Clock, Users, Heart, Zap, Coffee } from 'lucide-react'
import Link from 'next/link'

export default function CareersPage() {
  const jobs = [
    {
      id: 1,
      title: "Développeur Full-Stack Senior",
      department: "Engineering",
      location: "Bucarest / Remote",
      type: "CDI",
      experience: "5+ ans",
      description: "Rejoignez notre équipe pour développer la prochaine génération de notre plateforme de streaming IA.",
      skills: ["React", "Node.js", "TypeScript", "AWS", "Docker"],
      urgent: true
    },
    {
      id: 2,
      title: "Ingénieur IA/ML",
      department: "R&D",
      location: "Bucarest / Remote",
      type: "CDI",
      experience: "3+ ans",
      description: "Développez nos algorithmes d'upscaling vidéo et d'analyse comportementale.",
      skills: ["Python", "TensorFlow", "PyTorch", "Computer Vision", "Deep Learning"],
      urgent: false
    },
    {
      id: 3,
      title: "Product Manager",
      department: "Product",
      location: "Remote",
      type: "CDI",
      experience: "4+ ans",
      description: "Définissez la roadmap produit et coordonnez le développement de nouvelles fonctionnalités.",
      skills: ["Product Strategy", "Analytics", "UX/UI", "Agile", "Data Analysis"],
      urgent: false
    },
    {
      id: 4,
      title: "DevOps Engineer",
      department: "Infrastructure",
      location: "Bucarest / Remote",
      type: "CDI",
      experience: "3+ ans",
      description: "Optimisez notre infrastructure cloud et automatisez nos déploiements.",
      skills: ["Kubernetes", "AWS", "Terraform", "CI/CD", "Monitoring"],
      urgent: false
    }
  ]

  const benefits = [
    {
      icon: <Heart className="h-6 w-6" />,
      title: "Équilibre vie pro/perso",
      description: "Horaires flexibles et télétravail possible"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Croissance rapide",
      description: "Évoluez avec une startup en pleine expansion"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Équipe internationale",
      description: "Collaborez avec des talents du monde entier"
    },
    {
      icon: <Coffee className="h-6 w-6" />,
      title: "Environnement stimulant",
      description: "Bureaux modernes et ambiance décontractée"
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
            <Briefcase className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">Carrières chez Vistream</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Rejoignez une équipe passionnée qui révolutionne le streaming vidéo avec l'IA. 
            Construisons ensemble l'avenir de la diffusion de contenu.
          </p>
        </div>

        {/* Company Culture */}
        <div className="mb-12">
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6 text-center">Pourquoi Vistream ?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {benefits.map((benefit, index) => (
                  <div key={index} className="text-center">
                    <div className="inline-flex p-3 bg-primary/10 rounded-full text-primary mb-4">
                      {benefit.icon}
                    </div>
                    <h3 className="font-semibold mb-2">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Listings */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Postes Ouverts</h2>
          <div className="space-y-6">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        {job.urgent && (
                          <Badge variant="destructive" className="text-xs">
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Briefcase className="h-4 w-4" />
                          <span>{job.department}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{job.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{job.type}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">{job.experience}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{job.description}</p>
                  <div className="mb-4">
                    <h4 className="font-semibold mb-2">Compétences requises :</h4>
                    <div className="flex flex-wrap gap-2">
                      {job.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <Button>Postuler</Button>
                    <Button variant="outline">En savoir plus</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Application Process */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Notre Processus de Recrutement</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Candidature</h3>
                <p className="text-sm text-muted-foreground">Envoyez votre CV et lettre de motivation</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Entretien RH</h3>
                <p className="text-sm text-muted-foreground">Discussion sur votre parcours et motivations</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Test Technique</h3>
                <p className="text-sm text-muted-foreground">Évaluation de vos compétences techniques</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold">4</span>
                </div>
                <h3 className="font-semibold mb-2">Entretien Final</h3>
                <p className="text-sm text-muted-foreground">Rencontre avec l'équipe et décision</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Contact CTA */}
        <Card className="bg-gradient-to-r from-primary/10 to-blue-50 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-bold mb-4">Vous ne trouvez pas le poste idéal ?</h3>
            <p className="text-muted-foreground mb-6">
              Nous sommes toujours à la recherche de talents exceptionnels. 
              Envoyez-nous votre candidature spontanée !
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button>Candidature Spontanée</Button>
              <Button variant="outline">jobs@vistream.net</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 