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
    content: z.string().max(1000),
  }).optional(),
})

// GET /api/admin/contacts/[id] - Get contact details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return withAdmin(async (request: NextRequest, user) => {
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
    
    // Get contact with populated fields
    const contact = await Contact.findById(id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('notes.author', 'firstName lastName email')
      .lean() as any

    if (!contact) {
      return NextResponse.json(
          { success: false, error: 'Message de contact non trouvé.' },
        { status: 404 }
      )
    }

    // Mark as read if it's new
    if (contact.status === 'new') {
      const updatedContact = await Contact.findByIdAndUpdate(
        id, 
        { status: 'read' }, 
        { new: true }
      )
      .populate('assignedTo', 'firstName lastName email')
      .populate('notes.author', 'firstName lastName email')
      .lean() as any
      
      return NextResponse.json({
        success: true,
        data: updatedContact
      })
    }

    return NextResponse.json({
      success: true,
      data: contact
    })

  } catch (error) {
    console.error('Error fetching contact:', error)
    return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération du message.' },
      { status: 500 }
    )
  }
  })(request)
}

// PUT /api/admin/contacts/[id] - Update contact
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return withAdmin(async (request: NextRequest, user) => {
  try {
    // Apply rate limiting (bypassed for admin users)
    const rateLimitResult = rateLimit(request, rateLimitConfigs.default, user)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitResponse(rateLimitResult.resetTime),
        { status: 429 }
      )
    }

    const body = await request.json()
      console.log('Update contact request body:', body)
    
    // Validate input
    const validatedData = updateContactSchema.parse(body)
      console.log('Validated data:', validatedData)
    
    await connectToDatabase()
    
    // Check if contact exists
    const contact = await Contact.findById(id)
    if (!contact) {
      return NextResponse.json(
          { success: false, error: 'Message de contact non trouvé.' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {}
    
    if (validatedData.status) {
      updateData.status = validatedData.status
    }
    
    if (validatedData.priority) {
      updateData.priority = validatedData.priority
    }
    
    if (validatedData.assignedTo) {
      // Validate that the assigned user exists and is admin
      const assignedUser = await User.findById(validatedData.assignedTo)
      if (!assignedUser || assignedUser.role !== 'admin') {
        return NextResponse.json(
            { success: false, error: 'Utilisateur assigné invalide.' },
          { status: 400 }
        )
      }
      updateData.assignedTo = validatedData.assignedTo
    }
    
    if (validatedData.tags) {
      updateData.tags = validatedData.tags
    }
      
      console.log('Update data before note:', updateData)
    
    // Add note if provided
    if (validatedData.note) {
      updateData.$push = {
        notes: {
          content: validatedData.note.content,
          author: user.userId,
          createdAt: new Date()
        }
      }
        console.log('Added note to update data:', updateData)
    }
    
    // Update contact
    const updatedContact = await Contact.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('assignedTo', 'firstName lastName email')
    .populate('notes.author', 'firstName lastName email')
      
      console.log('Updated contact:', updatedContact)
    
    return NextResponse.json({
      success: true,
      message: 'Message mis à jour avec succès.',
      data: updatedContact
    })
    
  } catch (error) {
    console.error('Error updating contact:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
            success: false,
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
        { success: false, error: 'Erreur lors de la mise à jour du message.' },
      { status: 500 }
    )
  }
  })(request)
}

// DELETE /api/admin/contacts/[id] - Delete contact
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return withAdmin(async (request: NextRequest, user) => {
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
    
    // Check if contact exists
    const contact = await Contact.findById(id)
    if (!contact) {
      return NextResponse.json(
          { success: false, error: 'Message de contact non trouvé.' },
        { status: 404 }
      )
    }

    // Delete contact
    await Contact.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: 'Message supprimé avec succès.'
    })

  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json(
        { success: false, error: 'Erreur lors de la suppression du message.' },
      { status: 500 }
    )
  }
  })(request)
} 