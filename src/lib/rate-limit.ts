import { NextRequest } from 'next/server'
import { AuthenticatedUser } from './rbac'
import { getClientIP as getIP } from './ip-utils'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store for rate limiting (use Redis in production)
const store: RateLimitStore = {}

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
}

export const rateLimitConfigs = {
  // Authentication endpoints
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes
  register: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 registrations per hour
  verifyOtp: { windowMs: 15 * 60 * 1000, maxRequests: 10 }, // 10 attempts per 15 minutes
  resendOtp: { windowMs: 5 * 60 * 1000, maxRequests: 3 }, // 3 resends per 5 minutes
  forgotPassword: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 requests per hour
  
  // Admin operations
  adminOperations: { windowMs: 15 * 60 * 1000, maxRequests: 50 }, // 50 operations per 15 minutes
  
  // General API
  default: { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 100 requests per 15 minutes
}

export function rateLimit(request: NextRequest, config: RateLimitConfig, user?: AuthenticatedUser | null): {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
} {
  // Skip rate limiting in development mode
  if (process.env.NODE_ENV === 'development') {
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime: Date.now() + config.windowMs
    }
  }

  // Skip rate limiting for admin users
  if (user && user.role === 'admin') {
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime: Date.now() + config.windowMs
    }
  }

  // Get client IP
  const ip = getIP(request)
  const key = `${ip}:${request.nextUrl.pathname}`
  
  const now = Date.now()
  const windowStart = now - config.windowMs
  
  // Get or create rate limit entry
  let entry = store[key]
  
  if (!entry || entry.resetTime < now) {
    // Create new entry or reset expired one
    entry = {
      count: 0,
      resetTime: now + config.windowMs
    }
    store[key] = entry
  }
  
  // Check if within rate limit
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime: entry.resetTime
    }
  }
  
  // Increment counter
  entry.count++
  
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime
  }
}



export function createRateLimitResponse(resetTime: number) {
  const resetDate = new Date(resetTime)
  return {
    error: 'Trop de tentatives. Veuillez réessayer plus tard.',
    retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
    resetTime: resetDate.toISOString()
  }
} 