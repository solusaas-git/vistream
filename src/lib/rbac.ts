import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './auth'

export interface AuthenticatedUser {
  userId: string
  firstName: string
  lastName: string
  email: string
  phonePrefix: string
  phoneNumber: string
  role: 'admin' | 'user' | 'customer'
  isVerified: boolean
  isActive: boolean
  createdAt: Date
}

// Check if user has required role
export function hasRole(userRole: 'admin' | 'user' | 'customer', requiredRole: 'admin' | 'user' | 'customer'): boolean {
  const roleHierarchy: Record<string, number> = {
    'customer': 1,
    'user': 2,
    'admin': 3
  }
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

// Role-based route permissions
export const routePermissions: Record<string, 'admin' | 'user' | 'customer'> = {
  '/dashboard': 'customer',
  '/admin': 'user', // Allow both user and admin roles
  '/admin/subscription': 'customer',
  '/admin/subscriptions': 'user', // Allow both user and admin roles
  '/admin/profile': 'customer', // Allow all authenticated roles
  '/admin/users': 'admin', // Admin only - users have dedicated customers page
  '/admin/customers': 'user', // Allow users to see their customers
  '/admin/payments': 'admin', // Admin only
  '/admin/plans': 'admin', // Admin only
  '/admin/marketing': 'admin', // Admin only
  '/admin/contacts': 'admin', // Admin only (messages)
  '/admin/settings': 'admin', // Admin only
  '/user': 'user',
  '/api/admin': 'admin',
  '/api/admin/users': 'user', // Allow users to access their customers
  '/api/admin/payments': 'user', // Allow users to access payments for their customers
  '/api/admin/plans': 'admin',
  '/api/admin/marketing': 'admin',
  '/api/admin/contacts': 'admin',
  '/api/admin/settings': 'admin',
  '/api/admin/subscriptions': 'user', // Allow users to access their affiliated subscriptions
  '/api/users': 'user',
}

// Check if user can access route
export function canAccessRoute(userRole: 'admin' | 'user' | 'customer', route: string): boolean {
  const requiredRole = routePermissions[route]
  if (!requiredRole) {
    return true // Public route
  }
  
  return hasRole(userRole, requiredRole)
}

// Server-side functions that require database access (for API routes only)
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Dynamic import to avoid Edge Runtime issues
    const connectToDatabase = (await import('./mongoose')).default
    const User = (await import('@/models/User')).default
    
    // Get token from cookies or headers
    const token = request.cookies.get('auth-token')?.value || 
                 request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return null
    }

    // Verify token
    const payload = verifyToken(token)
    if (!payload) {
      return null
    }

    // Connect to database and get user
    await connectToDatabase()
    const user = await User.findById(payload.userId).select('firstName lastName email phonePrefix phoneNumber role isVerified isActive createdAt')
    
    if (!user || !user.isActive) {
      return null
    }

    return {
      userId: user._id.toString(),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      phonePrefix: user.phonePrefix || '+33',
      phoneNumber: user.phoneNumber || '',
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
      createdAt: user.createdAt
    }
  } catch (error) {
    console.error('Error getting authenticated user:', error)
    return null
  }
}

// Middleware to require authentication
export async function requireAuth(request: NextRequest): Promise<{ user: AuthenticatedUser } | NextResponse> {
  const user = await getAuthenticatedUser(request)
  
  if (!user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  if (!user.isVerified) {
    return NextResponse.json(
      { error: 'Account not verified' },
      { status: 401 }
    )
  }

  return { user }
}

// Middleware to require specific role
export async function requireRole(request: NextRequest, requiredRole: 'admin' | 'user' | 'customer'): Promise<{ user: AuthenticatedUser } | NextResponse> {
  const authResult = await requireAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { user } = authResult

  if (!hasRole(user.role, requiredRole)) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  return { user }
}

// Middleware to require admin role
export async function requireAdmin(request: NextRequest): Promise<{ user: AuthenticatedUser } | NextResponse> {
  return requireRole(request, 'admin')
}

// Middleware to require user role or higher
export async function requireUser(request: NextRequest): Promise<{ user: AuthenticatedUser } | NextResponse> {
  return requireRole(request, 'user')
}

// Helper to create protected API handler
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<NextResponse>,
  requiredRole?: 'admin' | 'user' | 'customer'
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      let authResult: { user: AuthenticatedUser } | NextResponse

      if (requiredRole) {
        authResult = await requireRole(request, requiredRole)
      } else {
        authResult = await requireAuth(request)
      }

      if (authResult instanceof NextResponse) {
        return authResult
      }

      return await handler(request, authResult.user, ...args)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}

// Helper to create admin-only API handler
export function withAdmin<T extends any[]>(
  handler: (request: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<NextResponse>
) {
  return withAuth(handler, 'admin')
} 