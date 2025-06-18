import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/mongoose'
import Contact from '@/models/Contact'
import { withAuth } from '@/lib/rbac'
import { rateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit'

// GET /api/admin/contacts/unread-count - Get count of unread messages
export const GET = withAuth(async (request: NextRequest, user) => {
  try {
    // Apply rate limiting (bypassed for admin users)
    const rateLimitResult = rateLimit(request, rateLimitConfigs.default, user)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitResponse(rateLimitResult.resetTime),
        { status: 429 }
      )
    }

    await connectToDatabase()

    // Count only messages with status 'new'
    const unreadCount = await Contact.countDocuments({ 
      status: 'new' 
    })

    return NextResponse.json({
      success: true,
      data: {
        unreadCount
      }
    })

  } catch (error) {
    console.error('Error fetching unread messages count:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du comptage des messages non lus' },
      { status: 500 }
    )
  }
}, 'user') // Allow both user and admin roles 