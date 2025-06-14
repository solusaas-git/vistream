import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongoose'
import { verifyToken } from '@/lib/auth'
import Plan from '@/models/Plan'

// GET /api/admin/plans - Fetch all plans
export async function GET(request: NextRequest) {
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

    // Fetch plans from database
    const plans = await Plan.find({}).sort({ order: 1 })

    // If no plans exist, create default plans
    if (plans.length === 0) {
      const defaultPlans = [
        {
          name: 'Starter',
          description: 'Pour débuter avec le streaming IA',
          price: '15€',
          period: 'mois',
          highlight: false,
          features: ['500 Go bande passante', '1 To stockage', 'Live 1080p', 'Analytics de base', 'Support email'],
          isActive: true,
          order: 1
        },
        {
          name: 'Standard',
          description: 'Le choix des professionnels',
          price: '120,99€',
          period: '12 mois',
          highlight: false,
          features: ['1 To bande passante', '3 To stockage', 'Live 4K', '1 add-on IA', 'Analytics avancés', 'Support prioritaire'],
          isActive: true,
          order: 2
        },
        {
          name: 'Pro',
          description: 'Pour les entreprises exigeantes',
          price: '199€',
          period: '24 mois',
          highlight: true,
          features: ['3 To bande passante', '10 To stockage', 'Live 8K', 'SLA 99,9%', 'Support 24/7', 'Analytics IA', 'DRM enterprise'],
          isActive: true,
          order: 3
        }
      ]

      await Plan.insertMany(defaultPlans)
      const createdPlans = await Plan.find({}).sort({ order: 1 })
      
      return NextResponse.json({
        success: true,
        data: { plans: createdPlans }
      })
    }

    return NextResponse.json({
      success: true,
      data: { plans }
    })

  } catch (error) {
    console.error('Plans fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur lors de la récupération des plans' },
      { status: 500 }
    )
  }
}

// POST /api/admin/plans - Create new plan
export async function POST(request: NextRequest) {
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

    // Get plan data from request body
    const planData = await request.json()

    // Validate required fields
    if (!planData.name || !planData.description || !planData.price || !planData.period) {
      return NextResponse.json(
        { success: false, error: 'Nom, description, prix et période sont requis' },
        { status: 400 }
      )
    }

    // Create new plan in database
    const newPlan = new Plan(planData)
    await newPlan.save()

    return NextResponse.json({
      success: true,
      message: 'Plan créé avec succès',
      data: { plan: newPlan }
    })

  } catch (error) {
    console.error('Plan creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur lors de la création du plan' },
      { status: 500 }
    )
  }
} 