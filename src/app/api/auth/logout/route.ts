import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Create response
    const response = NextResponse.json({
      message: 'Déconnexion réussie.',
    }, { status: 200 })
    
    // Clear authentication cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict' as const,
      path: '/',
      maxAge: 0, // Expire immediately
    }
    
    response.cookies.set('auth-token', '', cookieOptions)
    response.cookies.set('refresh-token', '', cookieOptions)
    
    return response
    
  } catch (error) {
    console.error('Logout error:', error)
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur.' },
      { status: 500 }
    )
  }
} 