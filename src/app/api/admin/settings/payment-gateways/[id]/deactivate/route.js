import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/rbac'
import connectToDatabase from '@/lib/mongoose'
import PaymentGateway from '@/models/PaymentGateway'

// POST - Deactivate payment gateway
export async function POST(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user || !['admin', 'user'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    // Await params in Next.js 15
    const { id } = await params
    const gateway = await PaymentGateway.findById(id)
    if (!gateway) {
      return NextResponse.json(
        { success: false, error: 'Passerelle de paiement non trouvée' },
        { status: 404 }
      )
    }

    // Deactivate this gateway
    gateway.isActive = false
    gateway.status = 'inactive'
    gateway.updatedBy = user.userId
    await gateway.save()

    return NextResponse.json({
      success: true,
      message: 'Passerelle de paiement désactivée avec succès',
      data: gateway
    })

  } catch (error) {
    console.error('Error deactivating payment gateway:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la désactivation de la passerelle de paiement' },
      { status: 500 }
    )
  }
} 