import { NextRequest, NextResponse } from "next/server"
import connectToDatabase from '@/lib/mongoose'
import User from '@/models/User'
import Payment from '@/models/Payment'
import { withAuth } from '@/lib/rbac'

export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    // Only admins can access affiliation data
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      )
    }

    await connectToDatabase()

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // Default to 30 days
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Get users with affiliation codes
    const affiliatedUsers = await User.find({
      affiliationCode: { $exists: true, $ne: '' }
    }).select('firstName lastName email affiliationCode createdAt').lean()

    // Get payments with affiliation tracking
    const affiliationPayments = await Payment.find({
      createdAt: { $gte: startDate },
      status: 'completed',
      'metadata.affiliationCode': { $exists: true, $ne: '' }
    }).populate('userId', 'firstName lastName email').lean()

    // Get all completed payments for the period
    const allPayments = await Payment.find({
      createdAt: { $gte: startDate },
      status: 'completed'
    }).populate('userId', 'firstName lastName email').lean()

    // Calculate affiliation statistics
    const affiliationStats = {
      totalAffiliations: affiliatedUsers.length,
      totalRevenue: allPayments.reduce((sum, payment) => {
        const amount = typeof payment.amount === 'number' ? payment.amount : (payment.amount?.value || 0)
        return sum + amount
      }, 0),
      affiliationRevenue: affiliationPayments.reduce((sum, payment) => {
        const amount = typeof payment.amount === 'number' ? payment.amount : (payment.amount?.value || 0)
        return sum + amount
      }, 0),
      affiliationRate: allPayments.length > 0 ? (affiliationPayments.length / allPayments.length * 100) : 0,
      totalCustomers: allPayments.length,
      affiliatedCustomers: affiliationPayments.length
    }

    // Group payments by affiliation code
    const affiliationBreakdown = affiliationPayments.reduce((acc: any, payment: any) => {
      const code = payment.metadata?.affiliationCode
      if (!code) return acc

      if (!acc[code]) {
        acc[code] = {
          code,
          payments: [],
          totalRevenue: 0,
          customerCount: 0,
          customers: new Set()
        }
      }

      const paymentAmount = typeof payment.amount === 'number' ? payment.amount : (payment.amount?.value || 0)
      
      acc[code].payments.push({
        id: payment._id,
        amount: paymentAmount,
        currency: payment.currency,
        customerName: payment.userId ? `${payment.userId.firstName} ${payment.userId.lastName}` : 'Unknown',
        customerEmail: payment.userId?.email || 'Unknown',
        date: payment.createdAt,
        planName: payment.metadata?.planName || 'Unknown'
      })

      acc[code].totalRevenue += paymentAmount
      if (payment.userId?.email) {
        acc[code].customers.add(payment.userId.email)
      }

      return acc
    }, {})

    // Convert sets to counts and format data
    const formattedBreakdown = Object.values(affiliationBreakdown).map((item: any) => ({
      ...item,
      customerCount: item.customers.size,
      customers: undefined // Remove the Set object
    }))

    // Recent affiliation activity
    const recentActivity = affiliationPayments
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map((payment: any) => {
        const paymentAmount = typeof payment.amount === 'number' ? payment.amount : (payment.amount?.value || 0)
        return {
          id: payment._id,
          type: 'payment',
          description: `Paiement via code ${payment.metadata?.affiliationCode}`,
          customerName: payment.userId ? `${payment.userId.firstName} ${payment.userId.lastName}` : 'Unknown',
          customerEmail: payment.userId?.email || 'Unknown',
          amount: paymentAmount,
          currency: payment.currency,
          date: payment.createdAt,
          affiliationCode: payment.metadata?.affiliationCode
        }
      })

    return NextResponse.json({
      success: true,
      data: {
        stats: affiliationStats,
        breakdown: formattedBreakdown,
        recentActivity,
        affiliatedUsers: affiliatedUsers.map(user => ({
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          code: user.affiliationCode,
          joinDate: user.createdAt
        })),
        period: parseInt(period)
      }
    })

  } catch (error) {
    console.error('Error fetching affiliation data:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}, 'admin') // Only admin role allowed
