import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { config } from './config'

// Custom error classes
export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Données de validation invalides') {
    super(message, 400)
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentification requise') {
    super(message, 401)
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Accès non autorisé') {
    super(message, 403)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Ressource non trouvée') {
    super(message, 404)
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflit de ressource') {
    super(message, 409)
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Trop de tentatives') {
    super(message, 429)
  }
}

// Error response interface
interface ErrorResponse {
  error: string
  message?: string
  details?: any
  timestamp: string
  path?: string
  requestId?: string
}

// Log error function
export function logError(error: Error, context?: any) {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    context,
  }

  if (config.NODE_ENV === 'production') {
    // In production, you might want to send to external logging service
    console.error('Application Error:', JSON.stringify(errorInfo, null, 2))
  } else {
    console.error('Application Error:', errorInfo)
  }
}

// Handle different types of errors
export function handleError(error: unknown, path?: string): NextResponse {
  let statusCode = 500
  let message = 'Erreur interne du serveur'
  let details: any = undefined

  // Generate request ID for tracking
  const requestId = Math.random().toString(36).substring(2, 15)

  if (error instanceof AppError) {
    statusCode = error.statusCode
    message = error.message
  } else if (error instanceof ZodError) {
    statusCode = 400
    message = 'Données de validation invalides'
    details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }))
  } else if (error instanceof Error) {
    // MongoDB errors
    if ((error as any).code === 11000) {
      statusCode = 409
      message = 'Cette ressource existe déjà'
      const field = Object.keys((error as any).keyValue || {})[0]
      if (field) {
        details = { field, message: `${field} déjà utilisé` }
      }
    } else if (error.name === 'ValidationError') {
      statusCode = 400
      message = 'Erreur de validation des données'
      details = (error as any).errors
    } else if (error.name === 'CastError') {
      statusCode = 400
      message = 'Format de données invalide'
    } else if (error.name === 'JsonWebTokenError') {
      statusCode = 401
      message = 'Token invalide'
    } else if (error.name === 'TokenExpiredError') {
      statusCode = 401
      message = 'Token expiré'
    } else {
      message = config.NODE_ENV === 'production' 
        ? 'Erreur interne du serveur' 
        : error.message
    }
  }

  // Log the error
  logError(error instanceof Error ? error : new Error(String(error)), {
    statusCode,
    path,
    requestId,
  })

  // Create error response
  const errorResponse: ErrorResponse = {
    error: message,
    timestamp: new Date().toISOString(),
    ...(path && { path }),
    ...(config.NODE_ENV !== 'production' && { requestId }),
    ...(details && { details }),
  }

  // Add stack trace in development
  if (config.NODE_ENV !== 'production' && error instanceof Error) {
    (errorResponse as any).stack = error.stack
  }

  return NextResponse.json(errorResponse, { status: statusCode })
}

// Async error wrapper for API routes
export function asyncHandler(
  handler: (request: Request, context?: any) => Promise<NextResponse>
) {
  return async (request: Request, context?: any): Promise<NextResponse> => {
    try {
      return await handler(request, context)
    } catch (error) {
      return handleError(error, new URL(request.url).pathname)
    }
  }
}

// Validation helper
export function validateRequired(data: any, fields: string[]): void {
  const missing = fields.filter(field => !data[field])
  if (missing.length > 0) {
    throw new ValidationError(`Champs requis manquants: ${missing.join(', ')}`)
  }
}

// Database error helper
export function handleDatabaseError(error: any): never {
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0]
    throw new ConflictError(
      field === 'email' 
        ? 'Cette adresse email est déjà utilisée'
        : 'Cette ressource existe déjà'
    )
  }
  
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map((err: any) => err.message)
    throw new ValidationError(messages.join(', '))
  }
  
  if (error.name === 'CastError') {
    throw new ValidationError('Format de données invalide')
  }
  
  throw new AppError('Erreur de base de données', 500)
}

// Authentication error helper
export function handleAuthError(error: any): never {
  if (error.message.includes('Invalid credentials')) {
    throw new AuthenticationError('Email ou mot de passe incorrect')
  }
  
  if (error.message.includes('Account temporarily locked')) {
    throw new AuthenticationError('Compte temporairement verrouillé')
  }
  
  if (error.message.includes('Account not verified')) {
    throw new AuthenticationError('Compte non vérifié')
  }
  
  throw new AuthenticationError('Erreur d\'authentification')
}

// Success response helper
export function successResponse(data: any, message?: string, statusCode: number = 200) {
  return NextResponse.json({
    success: true,
    ...(message && { message }),
    data,
    timestamp: new Date().toISOString(),
  }, { status: statusCode })
}

// Pagination helper
export function paginationResponse(
  data: any[], 
  page: number, 
  limit: number, 
  total: number,
  message?: string
) {
  const totalPages = Math.ceil(total / limit)
  const hasNext = page < totalPages
  const hasPrev = page > 1

  return NextResponse.json({
    success: true,
    ...(message && { message }),
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
    },
    timestamp: new Date().toISOString(),
  })
} 