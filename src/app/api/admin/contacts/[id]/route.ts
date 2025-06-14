import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectToDatabase from '@/lib/mongoose'
import Contact from '@/models/Contact'
import User from '@/models/User'
import { withAdmin } from '@/lib/rbac'
import { rateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit'
import mongoose from 'mongoose'

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

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// GET /api/admin/contacts/[id] - Get contact details
export const GET = withAdmin(async (request: NextRequest, user, { params }: RouteParams) => {
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

    const { id } = await params
    
    // Get contact with populated fields
    const contact = await Contact.findById(id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('notes.author', 'firstName lastName email')
      .lean() as any

    if (!contact) {
      return NextResponse.json(
        { error: 'Message de contact non trouvé.' },
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
      { error: 'Erreur lors de la récupération du message.' },
      { status: 500 }
    )
  }
})

// PUT /api/admin/contacts/[id] - Update contact
export const PUT = withAdmin(async (request: NextRequest, user, { params }: RouteParams) => {
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
    
    // Validate input
    const validatedData = updateContactSchema.parse(body)
    
    await connectToDatabase()
    
    const { id } = await params
    
    // Check if contact exists
    const contact = await Contact.findById(id)
    if (!contact) {
      return NextResponse.json(
        { error: 'Message de contact non trouvé.' },
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
          { error: 'Utilisateur assigné invalide.' },
          { status: 400 }
        )
      }
      updateData.assignedTo = validatedData.assignedTo
    }
    
    if (validatedData.tags) {
      updateData.tags = validatedData.tags
    }
    
    // Add note if provided
    if (validatedData.note) {
      updateData.$push = {
        notes: {
          content: validatedData.note.content,
          author: user.userId,
          createdAt: new Date()
        }
      }
    }
    
    // Update contact
    const updatedContact = await Contact.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('assignedTo', 'firstName lastName email')
    .populate('notes.author', 'firstName lastName email')
    
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
      { error: 'Erreur lors de la mise à jour du message.' },
      { status: 500 }
    )
  }
})

// DELETE /api/admin/contacts/[id] - Delete contact
export const DELETE = withAdmin(async (request: NextRequest, user, { params }: RouteParams) => {
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

    const { id } = await params
    
    // Check if contact exists
    const contact = await Contact.findById(id)
    if (!contact) {
      return NextResponse.json(
        { error: 'Message de contact non trouvé.' },
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
      { error: 'Erreur lors de la suppression du message.' },
      { status: 500 }
    )
  }
}) 