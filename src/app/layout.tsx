import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ConditionalLayout } from '@/components/layout/conditional-layout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Vistream - Streaming vidéo 100% IA, ultra-rapide et sécurisé',
  description: 'Diffusez, analysez et monétisez vos vidéos en quelques clics. Notre IA améliore la qualité, génère des sous-titres multilingues et prédit l\'engagement de votre audience.',
  keywords: ['streaming', 'vidéo', 'IA', 'intelligence artificielle', 'CDN', 'analytics'],
  authors: [{ name: 'Vistream' }],
  creator: 'Vistream',
  publisher: 'Vistream',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
    shortcut: '/logo.svg',
  },
  metadataBase: new URL('https://vistream.net'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Vistream - Streaming vidéo 100% IA',
    description: 'Diffusez, analysez et monétisez vos vidéos en quelques clics avec notre plateforme IA.',
    url: 'https://vistream.net',
    siteName: 'Vistream',
    images: [
      {
        url: '/hero_dashboard.png',
        width: 1200,
        height: 630,
        alt: 'Vistream Dashboard',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vistream - Streaming vidéo 100% IA',
    description: 'Diffusez, analysez et monétisez vos vidéos en quelques clics avec notre plateforme IA.',
    images: ['/hero_dashboard.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <ConditionalLayout>
          {children}
        </ConditionalLayout>
      </body>
    </html>
  )
} 