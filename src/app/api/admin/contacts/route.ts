import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectToDatabase from '@/lib/mongoose'
import Contact from '@/models/Contact'
import User from '@/models/User'
import { withAdmin } from '@/lib/rbac'
import { rateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit'

// Validation schema for updating contact
const updateContactSchema = z.object({
  status: z.enum(['new', 'read', 'replied', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedTo: z.string().optional(),
  tags: z.array(z.string()).optional(),
  note: z.object({
    content: z.string().min(1).max(1000),
  }).optional(),
})

// GET /api/admin/contacts - List contacts with pagination and filtering
export const GET = withAdmin(async (request: NextRequest, user) => {
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

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const assignedTo = searchParams.get('assignedTo')
    const tags = searchParams.get('tags')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build filter query
    const filter: any = {}
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (status) {
      filter.status = status
    }
    
    if (priority) {
      filter.priority = priority
    }
    
    if (assignedTo) {
      filter.assignedTo = assignedTo
    }
    
    if (tags) {
      filter.tags = { $in: tags.split(',') }
    }
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate)
      }
      if (endDate) {
        const endDateTime = new Date(endDate)
        endDateTime.setDate(endDateTime.getDate() + 1)
        filter.createdAt.$lt = endDateTime
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get contacts with pagination
    const [contacts, total] = await Promise.all([
      Contact.find(filter)
        .populate('assignedTo', 'firstName lastName email')
        .populate('notes.author', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Contact.countDocuments(filter)
    ])

    const totalPages = Math.ceil(total / limit)

    // Get statistics
    const stats = await Contact.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    const statusStats = {
      new: 0,
      read: 0,
      replied: 0,
      closed: 0
    }

    stats.forEach(stat => {
      statusStats[stat._id as keyof typeof statusStats] = stat.count
    })

    return NextResponse.json({
      success: true,
      data: {
        contacts,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        stats: statusStats
      }
    })

  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des messages' },
      { status: 500 }
    )
  }
})

// POST /api/admin/contacts - Create new contact (for testing purposes)
export const POST = withAdmin(async (request: NextRequest, user) => {
  try {
    // Apply rate limiting (bypassed for admin users)
    const rateLimitResult = rateLimit(request, rateLimitConfigs.adminOperations, user)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitResponse(rateLimitResult.resetTime),
        { status: 429 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const contactSchema = z.object({
      name: z.string().min(2).max(100),
      email: z.string().email(),
      subject: z.string().min(5).max(200),
      message: z.string().min(10).max(5000),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      tags: z.array(z.string()).optional(),
    })
    
    const validatedData = contactSchema.parse(body)
    
    await connectToDatabase()
    
    // Create new contact
    const newContact = new Contact({
      name: validatedData.name,
      email: validatedData.email,
      subject: validatedData.subject,
      message: validatedData.message,
      priority: validatedData.priority || 'medium',
      tags: validatedData.tags || [],
      source: 'admin_created',
      status: 'new'
    })
    
    await newContact.save()
    
    return NextResponse.json({
      success: true,
      message: 'Message de contact créé avec succès.',
      data: { contact: newContact }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating contact:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Données invalides.', 
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Erreur lors de la création du message.' },
      { status: 500 }
    )
  }
}) 