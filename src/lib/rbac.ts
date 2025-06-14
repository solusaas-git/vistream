import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './auth'
import connectToDatabase from './mongoose'
import User, { UserRole } from '@/models/User'

export interface AuthenticatedUser {
  userId: string
  firstName: string
  lastName: string
  email: string
  phonePrefix: string
  phoneNumber: string
  role: UserRole
  isVerified: boolean
  isActive: boolean
  createdAt: Date
}

// Get authenticated user from request
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
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

// Check if user has required role
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    'customer': 1,
    'user': 2,
    'admin': 3
  }
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
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
export async function requireRole(request: NextRequest, requiredRole: UserRole): Promise<{ user: AuthenticatedUser } | NextResponse> {
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
  requiredRole?: UserRole
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

// Role-based route permissions
export const routePermissions: Record<string, UserRole> = {
  '/dashboard': 'customer',
  '/admin': 'admin',
  '/admin/users': 'admin',
  '/admin/settings': 'admin',
  '/user': 'user',
  '/api/admin': 'admin',
  '/api/users': 'user',
}

// Check if user can access route
export function canAccessRoute(userRole: UserRole, route: string): boolean {
  const requiredRole = routePermissions[route]
  if (!requiredRole) {
    return true // Public route
  }
  
  return hasRole(userRole, requiredRole)
} 