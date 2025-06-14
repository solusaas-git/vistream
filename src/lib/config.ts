// Environment configuration and validation
export const config = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI!,
  
  // JWT Secrets
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  
  // NextAuth
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
  
  // Email Configuration (now optional - using database SMTP settings)
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587'),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  FROM_EMAIL: process.env.FROM_EMAIL,
  FROM_NAME: process.env.FROM_NAME,
  
  // App Configuration
  APP_URL: process.env.APP_URL!,
  
  // Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  
  // Rate Limiting
  ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING !== 'false',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // Features
  ENABLE_EMAIL_VERIFICATION: process.env.ENABLE_EMAIL_VERIFICATION !== 'false',
  ENABLE_PASSWORD_RESET: process.env.ENABLE_PASSWORD_RESET !== 'false',
}

// Validate required environment variables
export function validateEnvironment() {
  const requiredVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'APP_URL',
  ]
  
  // SMTP variables are now optional since we use database configuration
  // Only require email config if email features are enabled AND no database SMTP is configured
  // This will be checked at runtime when sending emails
  
  const missingVars = requiredVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
      'Please check your .env.local file and ensure all required variables are set.'
    )
  }
  
  // Validate JWT secrets are strong enough
  if (config.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long')
  }
  
  if (config.JWT_REFRESH_SECRET.length < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters long')
  }
  
  // Validate URLs
  try {
    new URL(config.APP_URL)
    new URL(config.NEXTAUTH_URL)
  } catch (error) {
    throw new Error('APP_URL and NEXTAUTH_URL must be valid URLs')
  }
  
  console.log('✅ Environment configuration validated successfully')
}

// Security headers for production
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

// CORS configuration
export const corsConfig = {
  origin: config.NODE_ENV === 'production' 
    ? [config.APP_URL] 
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}

// Cookie configuration
export const cookieConfig = {
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  domain: config.NODE_ENV === 'production' 
    ? new URL(config.APP_URL).hostname 
    : undefined,
}

// Database configuration
export const dbConfig = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
  retryWrites: true,
}

// Email configuration
export const emailConfig = {
  pool: true,
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: config.SMTP_PORT === 465,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: config.NODE_ENV === 'production',
  },
}

// Token expiration times
export const tokenConfig = {
  accessToken: '24h',
  refreshToken: '7d',
  otpExpiry: 10 * 60 * 1000, // 10 minutes
  resetTokenExpiry: 60 * 60 * 1000, // 1 hour
}

// Validation schemas
export const validationConfig = {
  password: {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
  },
  email: {
    maxLength: 254,
  },
  name: {
    minLength: 2,
    maxLength: 50,
  },
  phone: {
    minLength: 8,
    maxLength: 15,
  },
} 