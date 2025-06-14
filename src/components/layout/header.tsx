'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X, LogIn, Rocket } from 'lucide-react'
import Image from 'next/image'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const navigation = [
    { name: 'Accueil', href: '#hero' },
    { name: 'Fonctionnalités', href: '#features' },
    { name: 'Tarifs', href: '#pricing' },
    { name: 'FAQ', href: '#faq' },
    { name: 'Contact', href: '#contact' },
  ]

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.querySelector(sectionId)
    if (element) {
      const offset = 80 // Account for sticky header
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset
      
      // Update URL hash without causing page reload
      window.history.pushState(null, '', sectionId)
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    } else {
      console.warn(`Section ${sectionId} not found`)
    }
  }, [])

  const handleNavClick = useCallback((e: React.MouseEvent, href: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    console.log('Navigation clicked:', href)
    setIsMenuOpen(false)
    
    if (href.startsWith('#')) {
      // If we're not on the home page, navigate to home with the anchor
      if (window.location.pathname !== '/') {
        window.location.href = '/' + href
        return
      }
      
      // If we're already on the home page, just scroll and update URL
      setTimeout(() => {
        scrollToSection(href)
      }, 100)
    }
  }, [scrollToSection])

  // Handle initial page load with hash
  useEffect(() => {
    const hash = window.location.hash
    if (hash) {
      console.log('Initial hash detected:', hash)
      setTimeout(() => {
        const element = document.querySelector(hash)
        if (element) {
          const offset = 80
          const elementPosition = element.getBoundingClientRect().top
          const offsetPosition = elementPosition + window.pageYOffset - offset
          
          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          })
        }
      }, 1000)
    }
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-4">
      <div className={`mx-auto max-w-7xl transition-all duration-300 ${
        isScrolled 
          ? 'bg-gray-900/95 backdrop-blur-xl shadow-lg border border-gray-700/50' 
          : 'bg-gray-900/90 backdrop-blur-md shadow-md border border-gray-700/30'
      } rounded-2xl`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button
              onClick={(e) => {
                e.preventDefault()
                if (window.location.pathname !== '/') {
                  window.location.href = '/'
                } else {
                  scrollToSection('#hero')
                }
              }}
              className="flex items-center space-x-3 cursor-pointer bg-transparent border-none hover:opacity-80 transition-opacity duration-200"
            >
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image
                  src="/logo.svg"
                  alt="Vistream Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-bold text-white">Vistream</span>
            </button>

            {/* Navigation Desktop */}
            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <button
                  key={item.name}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="text-sm font-medium text-gray-300 hover:text-white transition-colors cursor-pointer bg-transparent border-none relative group"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
                </button>
              ))}
            </nav>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-300 hover:text-white hover:bg-gray-800"
                onClick={() => window.location.href = '/auth/login'}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Se connecter
              </Button>
              <Button 
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                onClick={() => {
                  if (window.location.pathname !== '/') {
                    window.location.href = '/#pricing'
                  } else {
                    scrollToSection('#pricing')
                  }
                }}
              >
                <Rocket className="h-4 w-4 mr-2" />
                Commencer maintenant
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-gray-300 hover:text-white hover:bg-gray-800"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-gray-700/50">
              <nav className="flex flex-col space-y-3">
                {navigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className="text-sm font-medium text-gray-300 hover:text-white transition-colors text-left cursor-pointer bg-transparent border-none py-2"
                  >
                    {item.name}
                  </button>
                ))}
                <div className="flex flex-col space-y-2 pt-3 border-t border-gray-700/50">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="justify-start text-gray-300 hover:text-white hover:bg-gray-800"
                    onClick={() => {
                      setIsMenuOpen(false)
                      window.location.href = '/auth/login'
                    }}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Se connecter
                  </Button>
                  <Button 
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      setIsMenuOpen(false)
                      if (window.location.pathname !== '/') {
                        window.location.href = '/#pricing'
                      } else {
                        setTimeout(() => scrollToSection('#pricing'), 100)
                      }
                    }}
                  >
                    <Rocket className="h-4 w-4 mr-2" />
                    Commencer maintenant
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  )
} 