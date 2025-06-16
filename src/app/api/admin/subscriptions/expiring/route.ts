import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongoose'
import Subscription from '@/models/Subscription'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase()

    // Calculer la date dans 1 mois
    const now = new Date()
    const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Trouver les abonnements qui expirent dans le mois
    const expiringSubscriptions = await Subscription.find({
      status: 'active',
      endDate: {
        $gte: now,
        $lte: oneMonthFromNow
      }
    })
    .populate('userId', 'firstName lastName email')
    .sort({ endDate: 1 })
    .limit(10)
    .lean()

    // Transformer les données pour s'assurer que planPrice est un nombre et créer le nom complet
    const transformedSubscriptions = expiringSubscriptions.map(sub => ({
      ...sub,
      planPrice: parseFloat(sub.planPrice) || 0,
      userId: {
        ...(sub.userId as any),
        name: `${(sub.userId as any).firstName} ${(sub.userId as any).lastName}`
      }
    }))

    return NextResponse.json({
      success: true,
      data: transformedSubscriptions
    })

  } catch (error) {
    console.error('Error fetching expiring subscriptions:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des abonnements expirant' },
      { status: 500 }
    )
  }
} 