import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongoose'
import { verifyToken } from '@/lib/auth'

// DELETE /api/admin/subscriptions/[id] - Delete subscription
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token manquant' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Token invalide' },
        { status: 401 }
      )
    }

    const { id: subscriptionId } = await params

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'ID d\'abonnement manquant' },
        { status: 400 }
      )
    }

    // TODO: Implement actual subscription deletion when Subscription model is created
    // For now, just return success response
    console.log('Subscription deletion requested for ID:', subscriptionId)

    return NextResponse.json({
      success: true,
      message: 'Abonnement supprimé avec succès'
    })

  } catch (error) {
    console.error('Subscription deletion error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur lors de la suppression de l\'abonnement' },
      { status: 500 }
    )
  }
}

// GET /api/admin/subscriptions/[id] - Get single subscription
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB()

    // Get token from cookies
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token manquant' },
        { status: 401 }
      )
    }

    // Verify token
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Token invalide' },
        { status: 401 }
      )
    }

    const { id: subscriptionId } = await params

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'ID d\'abonnement manquant' },
        { status: 400 }
      )
    }

    // TODO: Implement actual subscription fetching when Subscription model is created
    // For now, return null/not found
    return NextResponse.json(
      { success: false, error: 'Abonnement non trouvé' },
      { status: 404 }
    )

  } catch (error) {
    console.error('Subscription fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur lors de la récupération de l\'abonnement' },
      { status: 500 }
    )
  }
} 