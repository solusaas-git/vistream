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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12">
          {/* Logo et description */}
          <div className="space-y-3 sm:space-y-4 lg:space-y-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="relative w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 flex-shrink-0">
                <Image
                  src="/logo.svg"
                  alt="Vistream Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-lg sm:text-xl lg:text-2xl font-bold">Vistream</span>
            </div>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground max-w-sm leading-relaxed">
              Streaming vidéo 100% IA, ultra-rapide et sécurisé. 
              Diffusez, analysez et monétisez vos contenus.
            </p>
            <div className="flex space-x-3 sm:space-x-4">
              <Link 
                href="https://linkedin.com/company/vistream" 
                className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-md"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
              </Link>
              <Link 
                href="https://twitter.com/vistream" 
                className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-md"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
              </Link>
            </div>
          </div>

          {/* Liens légaux */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-semibold text-sm sm:text-base lg:text-lg mb-3 sm:mb-4">Légal</h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href as any}
                    className="text-xs sm:text-sm lg:text-base text-muted-foreground hover:text-foreground transition-colors hover:underline"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Liens entreprise */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-semibold text-sm sm:text-base lg:text-lg mb-3 sm:mb-4">Entreprise</h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href as any}
                    className="text-xs sm:text-sm lg:text-base text-muted-foreground hover:text-foreground transition-colors hover:underline"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-semibold text-sm sm:text-base lg:text-lg mb-3 sm:mb-4">Support</h3>
            <ul className="space-y-2 sm:space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href as any}
                    className="text-xs sm:text-sm lg:text-base text-muted-foreground hover:text-foreground transition-colors hover:underline"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t mt-6 sm:mt-8 lg:mt-12 pt-6 sm:pt-8 lg:pt-10 text-center">
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
            © {currentYear} Vistream. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  )
} 