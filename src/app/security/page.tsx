import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Shield, Lock, Key, Eye, Server, FileCheck, Globe, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function SecurityPage() {
  const securityFeatures = [
    {
      icon: <Lock className="h-6 w-6" />,
      title: "Chiffrement AES-256",
      description: "Tous vos contenus sont chiffrés avec l'algorithme AES-256 en transit et au repos",
      details: "Chiffrement de niveau militaire avec gestion des clés HSM certifiée FIPS 140-2 Level 3"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "DRM Multi-plateforme",
      description: "Protection contre le piratage avec Widevine, PlayReady et FairPlay",
      details: "Licence dynamique avec contrôle granulaire des droits et expiration automatique"
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Géo-restriction",
      description: "Contrôle géographique précis avec détection VPN/Proxy",
      details: "Blocage par pays, région ou ville avec base de données mise à jour en temps réel"
    },
    {
      icon: <Key className="h-6 w-6" />,
      title: "Authentification MFA",
      description: "Authentification multi-facteurs avec SSO et SAML",
      details: "Intégration Active Directory, LDAP avec logs d'audit détaillés"
    },
    {
      icon: <Eye className="h-6 w-6" />,
      title: "Watermarking Forensique",
      description: "Tatouage numérique invisible pour identifier les fuites",
      details: "Watermark unique par utilisateur avec monitoring automatique anti-piratage"
    },
    {
      icon: <Server className="h-6 w-6" />,
      title: "Infrastructure Sécurisée",
      description: "Datacenters certifiés avec redondance géographique",
      details: "Surveillance 24/7, détection d'intrusion et firewalls applicatifs"
    }
  ]

  const certifications = [
    { name: "SOC 2 Type II", status: "Certifié", color: "bg-green-100 text-green-800" },
    { name: "ISO 27001", status: "Certifié", color: "bg-green-100 text-green-800" },
    { name: "RGPD", status: "Conforme", color: "bg-blue-100 text-blue-800" },
    { name: "CCPA", status: "Conforme", color: "bg-blue-100 text-blue-800" },
    { name: "PCI DSS", status: "Level 1", color: "bg-purple-100 text-purple-800" },
    { name: "FIPS 140-2", status: "Level 3", color: "bg-orange-100 text-orange-800" }
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
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">Sécurité</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-3xl">
            La sécurité de vos contenus est notre priorité absolue. Découvrez nos mesures de protection de niveau entreprise.
          </p>
        </div>

        {/* Security Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Mesures de Sécurité</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityFeatures.map((feature, index) => (
              <Card key={index} className="h-full hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                      {feature.icon}
                    </div>
                    <span className="text-lg">{feature.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground">{feature.description}</p>
                  <p className="text-sm text-muted-foreground/80 border-l-2 border-primary/20 pl-3">
                    {feature.details}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Certifications & Conformité</h2>
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {certifications.map((cert, index) => (
                  <div key={index} className="text-center space-y-2 group cursor-pointer">
                    <Badge className={`${cert.color} w-full justify-center py-2 transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg hover:!bg-white hover:!text-primary hover:!border-primary`}>
                      {cert.name}
                    </Badge>
                    <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors duration-300">{cert.status}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Policies */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Politiques de Sécurité</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileCheck className="h-5 w-5" />
                  <span>Gestion des Données</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Anonymisation automatique des données personnelles</li>
                  <li>• Droit à l'oubli et portabilité des données</li>
                  <li>• Consentement granulaire et révocable</li>
                  <li>• Audit trails complets et horodatés</li>
                  <li>• Rétention des données selon réglementations</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Gestion des Incidents</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Équipe de réponse aux incidents 24/7</li>
                  <li>• Notification sous 72h en cas de breach</li>
                  <li>• Plan de continuité d'activité testé</li>
                  <li>• Sauvegardes automatiques multi-sites</li>
                  <li>• Tests de pénétration trimestriels</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Security Contact */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle>Signaler une Vulnérabilité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Si vous découvrez une vulnérabilité de sécurité, nous vous encourageons à nous la signaler de manière responsable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                security@vistream.net
              </Button>
              <Button variant="outline">
                <Key className="h-4 w-4 mr-2" />
                Clé PGP Publique
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Nous nous engageons à répondre dans les 24h et à corriger les vulnérabilités critiques sous 48h.
            </p>
          </CardContent>
        </Card>

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