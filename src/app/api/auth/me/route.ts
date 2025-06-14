import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/rbac'

// GET /api/auth/me - Get current user information
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user
    })

  } catch (error) {
    console.error('Error getting user info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 