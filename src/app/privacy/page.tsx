import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Shield, Eye, FileText, Users, Settings, Mail } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background py-16 pt-32">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">Politique de Confidentialité</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Votre vie privée est importante pour nous. Cette politique explique comment nous collectons, utilisons et protégeons vos données.
          </p>
        </div>

        <div className="space-y-6">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Introduction</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Vistream SRL ("nous", "notre", "nos") s'engage à protéger et respecter votre vie privée. Cette politique de confidentialité explique comment nous collectons, utilisons, partageons et protégeons vos informations personnelles lorsque vous utilisez notre plateforme de streaming vidéo.
              </p>
              <p className="text-sm text-muted-foreground">
                Cette politique s'applique à tous les utilisateurs de nos services, qu'ils soient visiteurs, utilisateurs gratuits ou clients payants.
              </p>
            </CardContent>
          </Card>

          {/* Données collectées */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Données que nous collectons</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Informations que vous nous fournissez :</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Nom, adresse email, numéro de téléphone</li>
                  <li>• Informations de facturation et de paiement</li>
                  <li>• Contenus vidéo que vous téléchargez</li>
                  <li>• Messages de support et communications</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Informations collectées automatiquement :</h4>
                <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                  <li>• Adresse IP et données de géolocalisation</li>
                  <li>• Type de navigateur et système d'exploitation</li>
                  <li>• Pages visitées et temps passé sur le site</li>
                  <li>• Données d'utilisation et de performance</li>
                  <li>• Cookies et technologies similaires</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Utilisation des données */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Comment nous utilisons vos données</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Nous utilisons vos données personnelles pour :
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                <li>• Fournir et améliorer nos services de streaming</li>
                <li>• Traiter vos paiements et gérer votre compte</li>
                <li>• Vous envoyer des notifications importantes</li>
                <li>• Analyser l'utilisation pour optimiser la plateforme</li>
                <li>• Détecter et prévenir la fraude</li>
                <li>• Respecter nos obligations légales</li>
                <li>• Vous contacter pour le support client</li>
              </ul>
            </CardContent>
          </Card>

          {/* Base légale */}
          <Card>
            <CardHeader>
              <CardTitle>Base légale du traitement (RGPD)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Consentement :</h4>
                  <p className="text-sm text-muted-foreground">
                    Marketing, cookies non-essentiels, analyses avancées
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Contrat :</h4>
                  <p className="text-sm text-muted-foreground">
                    Fourniture du service, gestion du compte, facturation
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Intérêt légitime :</h4>
                  <p className="text-sm text-muted-foreground">
                    Amélioration du service, sécurité, prévention de la fraude
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Obligation légale :</h4>
                  <p className="text-sm text-muted-foreground">
                    Conformité fiscale, conservation des données
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Partage des données */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Partage de vos données</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Nous ne vendons jamais vos données personnelles. Nous pouvons les partager uniquement dans les cas suivants :
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                <li>• <strong>Prestataires de services :</strong> AWS, Stripe, services d'email (sous contrat strict)</li>
                <li>• <strong>Obligations légales :</strong> Autorités compétentes si requis par la loi</li>
                <li>• <strong>Protection des droits :</strong> En cas de violation de nos conditions d'utilisation</li>
                <li>• <strong>Transfert d'entreprise :</strong> En cas de fusion ou acquisition (avec notification préalable)</li>
              </ul>
            </CardContent>
          </Card>

          {/* Vos droits */}
          <Card>
            <CardHeader>
              <CardTitle>Vos droits (RGPD)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Droit d'accès</h4>
                  <p className="text-sm text-muted-foreground">Obtenir une copie de vos données</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Droit de rectification</h4>
                  <p className="text-sm text-muted-foreground">Corriger des données inexactes</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Droit à l'effacement</h4>
                  <p className="text-sm text-muted-foreground">Supprimer vos données personnelles</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Droit à la portabilité</h4>
                  <p className="text-sm text-muted-foreground">Récupérer vos données dans un format standard</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Droit d'opposition</h4>
                  <p className="text-sm text-muted-foreground">Vous opposer au traitement</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Droit de limitation</h4>
                  <p className="text-sm text-muted-foreground">Limiter le traitement de vos données</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Pour exercer vos droits, contactez-nous à <strong>privacy@vistream.net</strong>. 
                  Nous répondrons dans les 30 jours maximum.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card>
            <CardHeader>
              <CardTitle>Cookies et Technologies Similaires</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Cookies Essentiels</h4>
                  <p className="text-sm text-muted-foreground">
                    Nécessaires au fonctionnement du site (authentification, sécurité)
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Cookies Analytics</h4>
                  <p className="text-sm text-muted-foreground">
                    Mesure d'audience et amélioration de l'expérience utilisateur
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Cookies Marketing</h4>
                  <p className="text-sm text-muted-foreground">
                    Personnalisation des publicités (avec votre consentement)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sécurité */}
          <Card>
            <CardHeader>
              <CardTitle>Sécurité des Données</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées :
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                <li>• Chiffrement AES-256 en transit et au repos</li>
                <li>• Authentification multi-facteurs</li>
                <li>• Accès limité aux données sur la base du besoin de savoir</li>
                <li>• Surveillance et détection d'intrusion 24/7</li>
                <li>• Sauvegardes automatiques et tests de récupération</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="h-5 w-5" />
                <span>Contact</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Pour toute question concernant cette politique de confidentialité ou vos données personnelles :
              </p>
              <div className="space-y-2">
                <p className="text-sm"><strong>Email :</strong> privacy@vistream.net</p>
                <p className="text-sm"><strong>Adresse :</strong> LT. RADU BELLER NR. 3-5 SECT. 1, BUCURESTI SECTORUL 1, Roumanie</p>
                <p className="text-sm"><strong>DPO :</strong> dpo@vistream.net</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center">
          <p className="text-sm text-muted-foreground">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>
    </div>
  )
} 