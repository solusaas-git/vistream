import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

export interface JWTPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

// Generate JWT token
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined')
  }
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '24h'
  })
}

// Generate refresh token
export function generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('JWT_REFRESH_SECRET is not defined')
  }
  
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d'
  })
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined')
    }
    
    return jwt.verify(token, process.env.JWT_SECRET) as JWTPayload
  } catch (error) {
    console.error('Token verification error:', error)
    return null
  }
}

// Verify refresh token
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET is not defined')
    }
    
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET) as JWTPayload
  } catch (error) {
    console.error('Refresh token verification error:', error)
    return null
  }
}

// Extract token from request
export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  
  // Also check for token in cookies
  const tokenCookie = request.cookies.get('auth-token')
  if (tokenCookie) {
    return tokenCookie.value
  }
  
  return null
}

// Rate limiting helper
export function createRateLimitKey(ip: string, endpoint: string): string {
  return `rate_limit:${ip}:${endpoint}`
}

// Sanitize user data for response
export function sanitizeUser(user: any) {
  const { password, otp, otpExpiry, resetToken, resetTokenExpiry, loginAttempts, lockUntil, __v, ...sanitized } = user.toObject ? user.toObject() : user
  return sanitized
} 