import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongoose'
import User from '@/models/User'
import crypto from 'crypto'

// Cache pour limiter les tentatives par IP
const attemptCache = new Map<string, { count: number, lastAttempt: number }>()

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { message: 'Token requis' },
        { status: 400 }
      )
    }

    // Protection contre les attaques par force brute
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    
    const now = Date.now()
    const attempts = attemptCache.get(clientIP)
    
    if (attempts) {
      // Réinitialiser le compteur après 15 minutes
      if (now - attempts.lastAttempt > 15 * 60 * 1000) {
        attemptCache.delete(clientIP)
      } else if (attempts.count >= 10) {
        return NextResponse.json(
          { message: 'Trop de tentatives. Veuillez patienter 15 minutes.' },
          { status: 429 }
        )
      }
    }

    await connectToDatabase()

    // Hasher le token reçu pour le comparer avec celui stocké
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    // Chercher l'utilisateur avec ce token hashé
    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() }
    }).select('+resetToken +resetTokenExpiry')

    // Incrémenter le compteur de tentatives
    const currentAttempts = attemptCache.get(clientIP) || { count: 0, lastAttempt: now }
    attemptCache.set(clientIP, {
      count: currentAttempts.count + 1,
      lastAttempt: now
    })

    console.log('Token recherché (hashé):', hashedToken.substring(0, 10) + '...')
    console.log('Utilisateur trouvé:', user ? `${user.email}` : 'Aucun')

    if (!user) {
      return NextResponse.json(
        { message: 'Token invalide ou expiré' },
        { status: 400 }
      )
    }

    // Réinitialiser le compteur en cas de succès
    attemptCache.delete(clientIP)

    return NextResponse.json(
      { message: 'Token valide' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 