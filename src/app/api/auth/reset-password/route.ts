import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongoose'
import User from '@/models/User'
import crypto from 'crypto'

// Cache pour limiter les tentatives par IP
const attemptCache = new Map<string, { count: number, lastAttempt: number }>()

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { message: 'Token et mot de passe requis' },
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
      } else if (attempts.count >= 5) { // Limite plus stricte pour reset
        return NextResponse.json(
          { message: 'Trop de tentatives. Veuillez patienter 15 minutes.' },
          { status: 429 }
        )
      }
    }

    // Validation du mot de passe
    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      )
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

    if (!user) {
      return NextResponse.json(
        { message: 'Token invalide ou expiré' },
        { status: 400 }
      )
    }

    // Mettre à jour le mot de passe et supprimer les tokens de réinitialisation
    user.password = password // Le middleware pre-save va hasher automatiquement
    user.resetToken = undefined
    user.resetTokenExpiry = undefined
    
    await user.save()

    // Réinitialiser le compteur en cas de succès
    attemptCache.delete(clientIP)

    console.log('Mot de passe réinitialisé pour:', user.email)

    return NextResponse.json(
      { message: 'Mot de passe réinitialisé avec succès' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 