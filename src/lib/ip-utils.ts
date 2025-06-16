import { NextRequest } from 'next/server'

/**
 * Comprehensive client IP detection for Next.js applications
 * Handles various deployment scenarios including Vercel, Netlify, AWS, etc.
 */
export function getClientIP(request: NextRequest): string {
  // Priority order for IP detection headers
  const ipHeaders = [
    'x-forwarded-for',      // Standard proxy header
    'x-real-ip',            // Nginx proxy header
    'cf-connecting-ip',     // Cloudflare header
    'x-client-ip',          // Alternative client IP header
    'x-forwarded',          // Alternative forwarded header
    'forwarded-for',        // Alternative forwarded header
    'forwarded',            // RFC 7239 standard
    'remote-addr',          // Direct connection header
    'x-cluster-client-ip',  // Cluster environments
    'x-original-forwarded-for', // Some load balancers
    'true-client-ip',       // Some CDNs
  ]

  // Check each header in priority order
  for (const header of ipHeaders) {
    const value = request.headers.get(header)
    if (value) {
      // Handle comma-separated IPs (take the first one)
      const ip = value.split(',')[0].trim()
      
      // Validate IP format and exclude private/local IPs in production
      if (isValidPublicIP(ip)) {
        return ip
      }
      
      // In development, accept local IPs
      if (process.env.NODE_ENV === 'development' && isValidIP(ip)) {
        return ip
      }
    }
  }

  // Special handling for development environment
  if (process.env.NODE_ENV === 'development') {
    const host = request.headers.get('host')
    
    // Log headers for debugging
    console.log('🔍 IP Detection Debug:')
    console.log('Host:', host)
    ipHeaders.forEach(header => {
      const value = request.headers.get(header)
      if (value) {
        console.log(`${header}:`, value)
      }
    })
    
    // Return localhost for development
    return '127.0.0.1'
  }

  // Production fallback - this should rarely happen
  console.warn('⚠️ Could not determine client IP, using fallback')
  return '0.0.0.0'
}

/**
 * Validate if a string is a valid IP address (IPv4 or IPv6)
 */
function isValidIP(ip: string): boolean {
  // IPv4 regex
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  
  // IPv6 regex (simplified)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/
  
  return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}

/**
 * Check if IP is a valid public IP (excludes private/local ranges)
 */
function isValidPublicIP(ip: string): boolean {
  if (!isValidIP(ip)) {
    return false
  }

  // Convert IPv6 loopback to IPv4
  if (ip === '::1') {
    ip = '127.0.0.1'
  }

  // In production, exclude private IP ranges
  if (process.env.NODE_ENV === 'production') {
    // Private IPv4 ranges
    const privateRanges = [
      /^127\./,           // Loopback
      /^10\./,            // Private Class A
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // Private Class B
      /^192\.168\./,      // Private Class C
      /^169\.254\./,      // Link-local
      /^0\.0\.0\.0$/,     // Invalid
    ]

    for (const range of privateRanges) {
      if (range.test(ip)) {
        return false
      }
    }
  }

  return true
}

/**
 * Get geographical information about an IP (placeholder for future implementation)
 */
export function getIPGeolocation(ip: string): { country?: string; city?: string; region?: string } {
  // This could be implemented with services like:
  // - MaxMind GeoIP2
  // - IP-API
  // - ipinfo.io
  // For now, return empty object
  return {}
}

/**
 * Check if IP is from a known bot/crawler
 */
export function isBotIP(ip: string, userAgent?: string): boolean {
  // Known bot IP ranges (simplified)
  const botRanges = [
    /^66\.249\./, // Googlebot
    /^157\.55\./, // Bingbot
    /^40\.77\./,  // Bingbot
  ]

  for (const range of botRanges) {
    if (range.test(ip)) {
      return true
    }
  }

  // Check user agent for bot indicators
  if (userAgent) {
    const botPatterns = [
      /googlebot/i,
      /bingbot/i,
      /slurp/i,
      /duckduckbot/i,
      /baiduspider/i,
      /yandexbot/i,
      /facebookexternalhit/i,
      /twitterbot/i,
      /linkedinbot/i,
      /whatsapp/i,
      /telegrambot/i,
    ]

    return botPatterns.some(pattern => pattern.test(userAgent))
  }

  return false
} 