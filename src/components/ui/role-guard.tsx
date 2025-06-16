'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  userId: string
  firstName: string
  lastName: string
  email: string
  role: 'admin' | 'user' | 'customer'
  isVerified: boolean
  isActive: boolean
}

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: ('admin' | 'user' | 'customer')[]
  fallbackPath?: string
  showLoading?: boolean
  loadingComponent?: React.ReactNode
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallbackPath = '/admin',
  showLoading = true,
  loadingComponent 
}: RoleGuardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const router = useRouter()

  const checkUserRole = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()

      if (data.success && data.user) {
        setUser(data.user)
        
        // Check if user's role is in allowed roles
        const userHasAccess = allowedRoles.includes(data.user.role)
        setHasAccess(userHasAccess)
        
        if (!userHasAccess) {
          // Redirect based on user role
          if (data.user.role === 'customer') {
            window.location.href = '/admin/subscription'
          } else if (data.user.role === 'user') {
            window.location.href = '/admin'
          } else {
            window.location.href = fallbackPath
          }
        }
      } else {
        // User not authenticated, redirect to login
        window.location.href = '/auth/login'
      }
    } catch (error) {
      console.error('Error checking user role:', error)
      window.location.href = '/auth/login'
    } finally {
      setLoading(false)
    }
  }, [allowedRoles, fallbackPath])

  useEffect(() => {
    checkUserRole()
  }, [checkUserRole])

  if (loading) {
    if (!showLoading) return null
    
    if (loadingComponent) {
      return <>{loadingComponent}</>
    }
    
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!hasAccess) {
    return null // Component will redirect, so don't render anything
  }

  return <>{children}</>
}

// Helper hook to get current user role
export function useUserRole() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me')
        const data = await response.json()

        if (data.success && data.user) {
          setUser(data.user)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  return { user, loading, isAdmin: user?.role === 'admin', isUser: user?.role === 'user', isCustomer: user?.role === 'customer' }
}

// Helper function to check if user can access a route
export function canUserAccessRoute(userRole: 'admin' | 'user' | 'customer', route: string): boolean {
  const roleHierarchy = {
    'customer': 1,
    'user': 2,
    'admin': 3
  }

  const routePermissions: Record<string, number> = {
    '/admin': 2, // user and admin
    '/admin/subscription': 1, // all roles
    '/admin/subscriptions': 2, // user and admin
    '/admin/profile': 1, // all roles
    '/admin/users': 3, // admin only - users have dedicated customers page
    '/admin/customers': 2, // user and admin (users see only their customers)
    '/admin/payments': 3, // admin only
    '/admin/plans': 3, // admin only
    '/admin/marketing': 3, // admin only
    '/admin/contacts': 3, // admin only
    '/admin/settings': 3, // admin only
  }

  const requiredLevel = routePermissions[route]
  if (!requiredLevel) return true // Public route

  const userLevel = roleHierarchy[userRole]
  return userLevel >= requiredLevel
} 