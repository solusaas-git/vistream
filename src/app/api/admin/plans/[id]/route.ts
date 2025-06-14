import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongoose'
import { verifyToken } from '@/lib/auth'
import Plan from '@/models/Plan'

// PUT /api/admin/plans/[id] - Update plan
export async function PUT(
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

    const { id: planId } = await params

    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'ID de plan manquant' },
        { status: 400 }
      )
    }

    // Get plan data from request body
    const planData = await request.json()

    // Validate required fields
    if (!planData.name || !planData.description || !planData.price || !planData.period) {
      return NextResponse.json(
        { success: false, error: 'Nom, description, prix et période sont requis' },
        { status: 400 }
      )
    }

    // Find and update plan in database
    const updatedPlan = await Plan.findByIdAndUpdate(
      planId,
      planData,
      { new: true, runValidators: true }
    )

    if (!updatedPlan) {
      return NextResponse.json(
        { success: false, error: 'Plan non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Plan modifié avec succès',
      data: { plan: updatedPlan }
    })

  } catch (error) {
    console.error('Plan update error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur lors de la modification du plan' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/plans/[id] - Delete plan
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

    const { id: planId } = await params

    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'ID de plan manquant' },
        { status: 400 }
      )
    }

    // Find and delete plan from database
    const deletedPlan = await Plan.findByIdAndDelete(planId)

    if (!deletedPlan) {
      return NextResponse.json(
        { success: false, error: 'Plan non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Plan supprimé avec succès'
    })

  } catch (error) {
    console.error('Plan deletion error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur lors de la suppression du plan' },
      { status: 500 }
    )
  }
}

// GET /api/admin/plans/[id] - Get single plan
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

    const { id: planId } = await params

    if (!planId) {
      return NextResponse.json(
        { success: false, error: 'ID de plan manquant' },
        { status: 400 }
      )
    }

    // Find plan in database
    const plan = await Plan.findById(planId)

    if (!plan) {
      return NextResponse.json(
        { success: false, error: 'Plan non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { plan }
    })

  } catch (error) {
    console.error('Plan fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur lors de la récupération du plan' },
      { status: 500 }
    )
  }
} 