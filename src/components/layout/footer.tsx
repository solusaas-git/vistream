import Link from 'next/link'
import { Linkedin, Twitter } from 'lucide-react'
import Image from 'next/image'

export function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    legal: [
      { name: 'Mentions légales', href: '/legal' },
      { name: 'Sécurité', href: '/security' },
      { name: 'Politique de confidentialité', href: '/privacy' },
    ],
    company: [
      { name: 'À propos', href: '/about' },
      { name: 'Blog', href: '/blog' },
      { name: 'Carrières', href: '/careers' },
    ],
    support: [
      { name: 'Centre d\'aide', href: '/help' },
      { name: 'Documentation', href: '/docs' },
      { name: 'API', href: '/api' },
    ],
  }

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="relative w-8 h-8 flex-shrink-0">
                <Image
                  src="/logo.svg"
                  alt="Vistream Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-bold">Vistream</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Streaming vidéo 100% IA, ultra-rapide et sécurisé. 
              Diffusez, analysez et monétisez vos contenus.
            </p>
            <div className="flex space-x-4">
              <Link 
                href="https://linkedin.com/company/vistream" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link 
                href="https://twitter.com/vistream" 
                className="text-muted-foreground hover:text-foreground transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Liens légaux */}
          <div>
            <h3 className="font-semibold mb-4">Légal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href as any}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Liens entreprise */}
          <div>
            <h3 className="font-semibold mb-4">Entreprise</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href as any}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href as any}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Vistream. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  )
} 