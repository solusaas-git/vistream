'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Settings, 
  BarChart3, 
  Shield, 
  Home,
  LogOut,
  Menu,
  X,
  Crown,
  CreditCard,
  User,
  Target,
  Mail,
  ChevronRight,
  Receipt
} from 'lucide-react'

interface User {
  userId: string
  firstName: string
  lastName: string
  email: string
  role: 'admin' | 'user' | 'customer'
  isVerified: boolean
  isActive: boolean
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()

      if (data.success) {
        setUser(data.user)
        // Redirect customers to their subscription page if they're on the main admin route
        if (data.user.role === 'customer' && window.location.pathname === '/admin') {
          window.location.href = '/admin/subscription'
          return
        }
        // Only allow admin and user roles to access admin routes (except subscription)
        if (data.user.role !== 'admin' && data.user.role !== 'user' && data.user.role !== 'customer') {
          router.push('/auth/login')
        }
      } else {
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Close sidebar when clicking outside or navigating
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarOpen && !(event.target as Element).closest('[data-sidebar]')) {
        setSidebarOpen(false)
      }
    }
    
    if (sidebarOpen) {
      document.addEventListener('click', handleClickOutside)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [sidebarOpen])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  // Check if user has access to admin routes
  if (!user || !['admin', 'user', 'customer'].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="w-full max-w-sm sm:max-w-md shadow-xl border-0 backdrop-blur-sm bg-white/95">
          <CardContent className="p-6 sm:p-8 text-center">
            <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-bold mb-2">Accès Refusé</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </p>
            <Button 
              onClick={() => router.push('/auth/login')}
              className="w-full h-10 sm:h-12"
            >
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Navigation based on user role
  const getNavigation = () => {
    if (user?.role === 'customer') {
      return [
        {
          name: 'Mon abonnement',
          href: '/admin/subscription' as const,
          icon: CreditCard,
        },
        {
          name: 'Mon profil',
          href: '/admin/profile' as const,
          icon: User,
        },
      ]
    }
    
    if (user?.role === 'user') {
      // Navigation for users - dashboard, customers (their customers), subscriptions (their affiliations), and profile
      return [
        {
          name: 'Tableau de bord',
          href: '/admin' as const,
          icon: BarChart3,
        },
        {
          name: 'Mes clients',
          href: '/admin/customers' as const,
          icon: Users,
        },
        {
          name: 'Abonnements',
          href: '/admin/subscriptions' as const,
          icon: CreditCard,
        },
        {
          name: 'Mon profil',
          href: '/admin/profile' as const,
          icon: User,
        },
      ]
    }
    
    // Full admin navigation - only for admin role
    return [
      {
        name: 'Tableau de bord',
        href: '/admin' as const,
        icon: BarChart3,
      },
      {
        name: 'Utilisateurs',
        href: '/admin/users' as const,
        icon: Users,
      },
      {
        name: 'Abonnements',
        href: '/admin/subscriptions' as const,
        icon: CreditCard,
      },
      {
        name: 'Paiements',
        href: '/admin/payments' as const,
        icon: Receipt,
      },
      {
        name: 'Plans',
        href: '/admin/plans' as const,
        icon: Crown,
      },
      {
        name: 'Marketing',
        href: '/admin/marketing' as const,
        icon: Target,
      },
      {
        name: 'Messages',
        href: '/admin/contacts' as const,
        icon: Mail,
      },
      {
        name: 'Paramètres',
        href: '/admin/settings' as const,
        icon: Settings,
      },
    ]
  }

  const navigation = getNavigation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Enhanced Floating Sidebar */}
      <div 
        className={`
          fixed top-3 sm:top-4 left-3 sm:left-4 bottom-3 sm:bottom-4 z-50 w-72 sm:w-80 lg:w-72
          bg-gray-900/95 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-2xl border border-gray-700/50
          transform transition-all duration-300 ease-out lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)] sm:-translate-x-[calc(100%+1rem)]'}
        `}
        data-sidebar
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6 border-b border-gray-700/50">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="p-1 sm:p-1.5 bg-primary rounded-lg">
            <Image
              src="/logo.svg"
              alt="Vistream Logo"
                width={24}
                height={24}
                className="w-5 h-5 sm:w-6 sm:h-6 brightness-0 invert"
            />
            </div>
            <div className="min-w-0">
              <span className="text-lg sm:text-xl font-bold text-white truncate block">Vistream</span>
            </div>
            <Badge 
              variant="outline" 
              className="text-xs border-gray-600 text-gray-300 bg-gray-800/50 px-2 py-0.5 flex-shrink-0"
            >
              {user.role === 'customer' ? 'Client' : user.role === 'admin' ? 'Admin' : 'User'}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-gray-400 hover:text-white hover:bg-gray-800/50 h-8 w-8 p-0"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col overflow-hidden" style={{ height: 'calc(100% - 3.5rem)' }}>
          {/* Navigation */}
          <nav className="p-3 sm:p-4 space-y-1 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
              <Link
                key={item.name}
                href={item.href}
                  className={`
                    group flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg
                    font-medium text-sm sm:text-base transition-all duration-200
                    ${isActive 
                      ? 'bg-primary text-white shadow-lg' 
                      : 'text-gray-300 hover:bg-gray-800/70 hover:text-white'
                    }
                  `}
                onClick={() => setSidebarOpen(false)}
              >
                  <div className="flex items-center space-x-3 min-w-0">
                    <item.icon className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {isActive && (
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  )}
              </Link>
              )
            })}
          </nav>

          {/* User Profile & Actions */}
          <div className="p-3 sm:p-4 pt-2 border-t border-gray-700/50 space-y-2 sm:space-y-3 flex-shrink-0">
            {/* User Profile Section */}
            <button
              onClick={() => {
                setSidebarOpen(false)
                window.location.href = '/admin/profile'
              }}
              className="w-full flex items-center space-x-3 p-2 sm:p-3 hover:bg-gray-800/50 rounded-lg transition-all duration-200 group"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform flex-shrink-0">
                <User className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium text-xs sm:text-sm text-white group-hover:text-gray-100 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </button>

            {/* Action Buttons */}
            <div className="space-y-1 sm:space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800/50 h-8 sm:h-10 text-xs sm:text-sm"
                onClick={() => {
                  setSidebarOpen(false)
                  window.location.href = '/'
                }}
              >
                <Home className="h-3 w-3 sm:h-4 sm:w-4 mr-2 sm:mr-3" />
                Retour au site
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20 h-8 sm:h-10 text-xs sm:text-sm"
                onClick={handleLogout}
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-2 sm:mr-3" />
                Se déconnecter
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left: Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="h-12 w-12 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
            title="Ouvrir le menu"
          >
            <Menu className="h-7 w-7" />
          </Button>

          {/* Center: Logo */}
          <div className="flex items-center space-x-2 absolute left-1/2 transform -translate-x-1/2">
            <div className="p-1.5 bg-primary rounded-lg">
              <Image
                src="/logo.svg"
                alt="Vistream Logo"
                width={20}
                height={20}
                className="w-5 h-5 brightness-0 invert"
              />
            </div>
            <span className="text-lg font-bold text-gray-900">Vistream</span>
            <Badge 
              variant="outline" 
              className="text-xs border-gray-300 text-gray-600 bg-gray-50 px-2 py-0.5"
            >
              {user?.role === 'customer' ? 'Client' : user?.role === 'admin' ? 'Admin' : 'User'}
            </Badge>
          </div>

          {/* Right: Logout */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={handleLogout}
            title="Se déconnecter"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        </div>

      {/* Main Content Area */}
      <div className="lg:pl-80">
        {/* Page content */}
        <main className="pt-14 lg:pt-0 p-3 sm:p-4 lg:p-6 xl:p-8 min-h-screen">
          <div className="mx-auto max-w-7xl">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-xl border border-gray-200/50 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-3rem)] lg:min-h-[calc(100vh-4rem)]">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 