import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongoose'
import Plan from '@/models/Plan'

// GET /api/plans - Get all active plans (public endpoint)
export async function GET() {
  try {
    await connectDB()

    // Fetch only active plans, sorted by order
    const plans = await Plan.find({ isActive: true })
      .sort({ order: 1 })
      .select('-createdAt -updatedAt -__v')
      .lean()

    // If no plans exist, create default ones
    if (plans.length === 0) {
      const defaultPlans = [
        {
          name: 'Starter',
          description: 'Pour débuter avec le streaming IA',
          price: '15€',
          period: 'mois',
          highlight: false,
          features: [
            '500 Go bande passante',
            '1 To stockage',
            'Live 1080p',
            'Analytics de base',
            'Support email'
          ],
          isActive: true,
          order: 1
        },
        {
          name: 'Standard',
          description: 'Le choix des professionnels',
          price: '120,99€',
          period: '12 mois',
          highlight: true,
          features: [
            '1 To bande passante',
            '3 To stockage',
            'Live 4K',
            '1 add-on IA',
            'Analytics avancés',
            'Support prioritaire'
          ],
          isActive: true,
          order: 2
        },
        {
          name: 'Pro',
          description: 'Pour les entreprises exigeantes',
          price: '199€',
          period: '24 mois',
          highlight: false,
          features: [
            '3 To bande passante',
            '10 To stockage',
            'Live 8K',
            'SLA 99,9%',
            'Support 24/7',
            'Analytics IA',
            'DRM enterprise'
          ],
          isActive: true,
          order: 3
        }
      ]

      const createdPlans = await Plan.insertMany(defaultPlans)
      
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