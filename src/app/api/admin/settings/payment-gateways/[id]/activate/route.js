import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/rbac'
import connectToDatabase from '@/lib/mongoose'
import PaymentGateway from '@/models/PaymentGateway'

// POST - Activate payment gateway
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

    // Deactivate all other gateways first
    await PaymentGateway.updateMany(
      { _id: { $ne: id } },
      { isActive: false }
    )

    // Activate this gateway
    gateway.isActive = true
    gateway.status = 'active'
    gateway.updatedBy = user.userId
    await gateway.save()

    return NextResponse.json({
      success: true,
      message: 'Passerelle de paiement activée avec succès',
      data: gateway
    })

  } catch (error) {
    console.error('Error activating payment gateway:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'activation de la passerelle de paiement' },
      { status: 500 }
    )
  }
} 