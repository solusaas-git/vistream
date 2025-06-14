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

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMenuOpen && !(event.target as Element).closest('header')) {
        setIsMenuOpen(false)
      }
    }
    
    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isMenuOpen])

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
    <>
      <header className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-4 pt-3 sm:pt-4">
        <div className={`mx-auto max-w-7xl transition-all duration-300 ${
          isScrolled 
            ? 'bg-gray-900/95 backdrop-blur-xl shadow-lg border border-gray-700/50' 
            : 'bg-gray-900/90 backdrop-blur-md shadow-md border border-gray-700/30'
        } rounded-xl sm:rounded-2xl`}>
          <div className="px-4 sm:px-6 py-3 sm:py-4">
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
                className="flex items-center space-x-2 sm:space-x-3 cursor-pointer bg-transparent border-none hover:opacity-80 transition-opacity duration-200 min-w-0"
              >
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                  <Image
                    src="/logo.svg"
                    alt="Vistream Logo"
                    width={40}
                    height={40}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-lg sm:text-xl font-bold text-white truncate">Vistream</span>
              </button>

              {/* Navigation Desktop */}
              <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
                {navigation.map((item) => (
                  <button
                    key={item.name}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className="text-sm font-medium text-gray-300 hover:text-white transition-colors cursor-pointer bg-transparent border-none relative group px-2 py-1"
                  >
                    {item.name}
                    <span className="absolute -bottom-1 left-2 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-[calc(100%-16px)]"></span>
                  </button>
                ))}
              </nav>

              {/* CTA Buttons - Desktop */}
              <div className="hidden lg:flex items-center space-x-3">
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
                  <span className="hidden sm:inline">Commencer maintenant</span>
                  <span className="sm:hidden">Commencer</span>
                </Button>
              </div>

              {/* Mobile CTA + Menu Button */}
              <div className="flex items-center space-x-2 lg:hidden">
                <Button 
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200 text-xs px-3 py-2 h-8"
                  onClick={() => {
                    if (window.location.pathname !== '/') {
                      window.location.href = '/#pricing'
                    } else {
                      scrollToSection('#pricing')
                    }
                  }}
                >
                  <Rocket className="h-3 w-3 mr-1" />
                  <span className="hidden xs:inline">Commencer</span>
                  <span className="xs:hidden">Start</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white hover:bg-gray-800 h-8 w-8 p-0"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label={isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
                  aria-expanded={isMenuOpen}
                >
                  {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMenuOpen(false)}
          />
          
          {/* Mobile Menu */}
          <div className="fixed top-20 left-3 right-3 bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl animate-in slide-in-from-top-4 duration-300">
            <div className="p-4 sm:p-6">
              <nav className="space-y-1">
                {navigation.map((item, index) => (
                  <button
                    key={item.name}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className="w-full text-left px-4 py-3 text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200 cursor-pointer bg-transparent border-none"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {item.name}
                  </button>
                ))}
              </nav>
              
              {/* Mobile CTA Section */}
              <div className="mt-6 pt-6 border-t border-gray-700/50 space-y-3">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 h-12 text-base"
                  onClick={() => {
                    setIsMenuOpen(false)
                    window.location.href = '/auth/login'
                  }}
                >
                  <LogIn className="h-5 w-5 mr-3" />
                  Se connecter
                </Button>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium shadow-lg"
                  onClick={() => {
                    setIsMenuOpen(false)
                    if (window.location.pathname !== '/') {
                      window.location.href = '/#pricing'
                    } else {
                      setTimeout(() => scrollToSection('#pricing'), 100)
                    }
                  }}
                >
                  <Rocket className="h-5 w-5 mr-3" />
                  Commencer maintenant
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 