import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Scale, Building, Mail, Phone } from 'lucide-react'
import Link from 'next/link'

export default function LegalPage() {
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
            <Scale className="h-8 w-8 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold">Mentions Légales</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Informations légales et réglementaires de Vistream
          </p>
        </div>

        <div className="space-y-6">
          {/* Éditeur du site */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Éditeur du site</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Vistream SRL</h3>
                <p className="text-sm text-muted-foreground">
                  Société à responsabilité limitée<br />
                  Capital social : 10.000 RON<br />
                  Numéro d'enregistrement : J2025025099008
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Siège social :</h4>
                <p className="text-sm text-muted-foreground">
                  LT. RADU BELLER NR. 3-5 SECT. 1<br />
                  BUCURESTI SECTORUL 1<br />
                  Roumanie
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Contact :</h4>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Mail className="h-4 w-4" />
                    <span>support@vistream.net</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Phone className="h-4 w-4" />
                    <span>+33 6 67 31 95 99</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Directeur de publication */}
          <Card>
            <CardHeader>
              <CardTitle>Directeur de publication</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Le directeur de publication est le représentant légal de Vistream SRL.
              </p>
            </CardContent>
          </Card>

          {/* Hébergement */}
          <Card>
            <CardHeader>
              <CardTitle>Hébergement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">Hébergeur web :</h4>
                <p className="text-sm text-muted-foreground">
                  Vercel Inc.<br />
                  340 S Lemon Ave #4133<br />
                  Walnut, CA 91789<br />
                  États-Unis
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Infrastructure cloud :</h4>
                <p className="text-sm text-muted-foreground">
                  Amazon Web Services (AWS)<br />
                  Microsoft Azure<br />
                  Google Cloud Platform
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Propriété intellectuelle */}
          <Card>
            <CardHeader>
              <CardTitle>Propriété intellectuelle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                L'ensemble de ce site relève de la législation roumaine et internationale sur le droit d'auteur et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
              </p>
              <p className="text-sm text-muted-foreground">
                La reproduction de tout ou partie de ce site sur un support électronique quel qu'il soit est formellement interdite sauf autorisation expresse du directeur de la publication.
              </p>
            </CardContent>
          </Card>

          {/* Limitation de responsabilité */}
          <Card>
            <CardHeader>
              <CardTitle>Limitation de responsabilité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Les informations contenues sur ce site sont aussi précises que possible et le site est périodiquement remis à jour, mais peut toutefois contenir des inexactitudes, des omissions ou des lacunes.
              </p>
              <p className="text-sm text-muted-foreground">
                Si vous constatez une lacune, erreur ou ce qui parait être un dysfonctionnement, merci de bien vouloir le signaler par email à support@vistream.net en décrivant le problème de la manière la plus précise possible.
              </p>
            </CardContent>
          </Card>

          {/* Droit applicable */}
          <Card>
            <CardHeader>
              <CardTitle>Droit applicable et juridiction</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Tout litige en relation avec l'utilisation du site vistream.net est soumis au droit roumain. En dehors des cas où la loi ne le permet pas, il est fait attribution exclusive de juridiction aux tribunaux compétents de Bucarest.
              </p>
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