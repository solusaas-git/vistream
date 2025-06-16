import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Simple route permissions for middleware (Edge Runtime compatible)
const routePermissions: Record<string, 'admin' | 'user' | 'customer'> = {
  '/admin/users': 'admin',
  '/admin/payments': 'admin',
  '/admin/plans': 'admin',
  '/admin/marketing': 'admin',
  '/admin/contacts': 'admin',
  '/admin/settings': 'admin',
}

// Simple role hierarchy check
function hasRole(userRole: 'admin' | 'user' | 'customer', requiredRole: 'admin' | 'user' | 'customer'): boolean {
  const roleHierarchy: Record<string, number> = {
    'customer': 1,
    'user': 2,
    'admin': 3
  }
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

// Check if user can access route
function canAccessRoute(userRole: 'admin' | 'user' | 'customer', route: string): boolean {
  const requiredRole = routePermissions[route]
  if (!requiredRole) {
    return true // Public route or not restricted
  }
  
  return hasRole(userRole, requiredRole)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/admin']
  
  // Auth routes that should redirect if already authenticated
  const authRoutes = ['/auth/login', '/auth/signup', '/auth/activate', '/auth/forgot-password']
  
  // Payment completion route (should not redirect)
  const paymentRoutes = ['/auth/complete-payment']
  
  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  const isPaymentRoute = paymentRoutes.some(route => pathname.startsWith(route))
  
  // Get token from cookies
  const token = request.cookies.get('auth-token')?.value
  
  // Properly validate token instead of just checking existence
  let isAuthenticated = false
  let userId = null
  let userRole = null
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')
      const { payload } = await jwtVerify(token, secret)
      isAuthenticated = true
      userId = payload.userId
    } catch (error) {
      // Invalid token, clear it
      isAuthenticated = false
    }
  }
  
  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    const response = NextResponse.redirect(loginUrl)
    if (token) response.cookies.delete('auth-token') // Clear invalid token
    return response
  }
  
  // For authenticated users accessing protected routes, check subscription status and role permissions
  if (isProtectedRoute && isAuthenticated && userId) {
    try {
      // Call the subscription status API with retry logic for webhook timing
      const baseUrl = request.nextUrl.origin
      let statusResponse
      let retryCount = 0
      const maxRetries = 2
      
      do {
        statusResponse = await fetch(`${baseUrl}/api/auth/subscription-status?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cookie': request.headers.get('cookie') || ''
        }
      })
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        userRole = statusData.user?.role
        
        // Check role-based route permissions
        if (userRole && !canAccessRoute(userRole, pathname)) {
          // User doesn't have permission to access this route
          // Redirect to their appropriate dashboard
          if (userRole === 'customer') {
            return NextResponse.redirect(new URL('/admin/subscription', request.url))
          } else if (userRole === 'user') {
            return NextResponse.redirect(new URL('/admin', request.url))
          } else {
            return NextResponse.redirect(new URL('/admin', request.url))
          }
        }
        
        // Only check subscription status for customers
        // Admins and users can access without subscription verification
        if (statusData.user && statusData.user.role === 'customer') {
            // If customer has active subscription, allow access
            if (statusData.subscription && statusData.subscription.status === 'active') {
              break // Exit retry loop, allow access
            }
            
          // If customer has a pending subscription, redirect to complete-payment
          if (statusData.subscription && statusData.subscription.status === 'pending') {
              // On first retry, wait a bit for webhook to process
              if (retryCount === 0) {
                await new Promise(resolve => setTimeout(resolve, 1000))
                retryCount++
                continue
              }
            return NextResponse.redirect(new URL('/auth/complete-payment', request.url))
          }
          
          // If customer has no subscription or inactive subscription, redirect to signup
          if (!statusData.subscription || statusData.subscription.status !== 'active') {
            return NextResponse.redirect(new URL('/auth/signup', request.url))
          }
        }
        // For admin and user roles, allow access without subscription check
          break
        }
        
        retryCount++
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } while (retryCount < maxRetries)
      
    } catch (error) {
      console.error('Error checking subscription status:', error)
      // On error, allow access but log the issue
    }
  }
  
  // Special handling for complete-payment page
  if (pathname === '/auth/complete-payment') {
    // Allow access to complete-payment page regardless of authentication status
    // The page itself will handle authentication and show appropriate messages
    // This is important for users returning from payment providers like Mollie
    return NextResponse.next()
  }
  
  // For auth routes, don't redirect if there's a specific query parameter indicating forced redirect
  const isForceRedirect = request.nextUrl.searchParams.has('force')
  
  // If force redirect, clear the token to prevent future redirects
  if (isAuthRoute && isForceRedirect && token) {
    const response = NextResponse.next()
    response.cookies.delete('auth-token')
    return response
  }
  
  // Redirect authenticated users from auth routes based on their role
  if (isAuthRoute && isAuthenticated) {
    try {
      // Call the subscription status API to get user role
      const baseUrl = request.nextUrl.origin
      const statusResponse = await fetch(`${baseUrl}/api/auth/subscription-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cookie': request.headers.get('cookie') || ''
        }
      })
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        
        // Redirect based on user role
        if (statusData.user && (statusData.user.role === 'admin' || statusData.user.role === 'user')) {
          // Admins and users go directly to admin panel
          return NextResponse.redirect(new URL('/admin', request.url))
        } else if (statusData.user && statusData.user.role === 'customer') {
          // Customers go to complete-payment for subscription check
          return NextResponse.redirect(new URL('/auth/complete-payment', request.url))
        }
      }
    } catch (error) {
      console.error('Error checking user role for auth route redirect:', error)
      // On error, redirect to complete-payment as fallback
      return NextResponse.redirect(new URL('/auth/complete-payment', request.url))
    }
  }
  
  // Clear invalid tokens for auth routes
  if (isAuthRoute && token && !isAuthenticated) {
    const response = NextResponse.next()
    response.cookies.delete('auth-token')
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}