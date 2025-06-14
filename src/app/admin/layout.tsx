'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
  Mail
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Check if user has access to admin routes
  if (!user || !['admin', 'user', 'customer'].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Accès Refusé</h2>
            <p className="text-muted-foreground mb-4">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </p>
            <Button onClick={() => router.push('/auth/login')}>
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
    
    // Admin and user navigation
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
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Floating Sidebar */}
      <div className={`
        fixed top-4 left-4 bottom-4 z-50 w-64 bg-gray-900 rounded-2xl shadow-2xl transform transition-all duration-300 ease-in-out lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <Image
              src="/logo.svg"
              alt="Vistream Logo"
              width={32}
              height={32}
              className="brightness-0 invert"
            />
            <span className="text-xl font-bold text-white">Vistream</span>
            <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
              {user.role === 'customer' ? 'Client' : user.role === 'admin' ? 'Admin' : 'Utilisateur'}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-gray-400 hover:text-white hover:bg-gray-800"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col" style={{ height: 'calc(100% - 4rem)' }}>
          <nav className="p-6 space-y-2 flex-1 overflow-y-auto min-h-0">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-200"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          <div className="p-6 pt-4 border-t border-gray-700 space-y-3 flex-shrink-0">
            {/* User Profile Section */}
            <button
              onClick={() => window.location.href = '/admin/profile'}
              className="w-full flex items-center space-x-3 p-2 hover:bg-gray-800 rounded-lg transition-all duration-200 group"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-sm text-white group-hover:text-gray-100">
                  {user.firstName} {user.lastName}
                </p>
              </div>
            </button>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
                onClick={() => window.location.href = '/'}
              >
                <Home className="h-4 w-4 mr-3" />
                Retour au site
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Se déconnecter
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Mobile menu button */}
        <div className="lg:hidden fixed top-4 right-4 z-40">
          <Button
            variant="default"
            size="sm"
            className="shadow-lg"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6 sm:p-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 