import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectToDatabase from '@/lib/mongoose'
import Contact from '@/models/Contact'
import { withAdmin } from '@/lib/rbac'
import { sendAdminReplyEmail } from '@/lib/email'

const replySchema = z.object({
  subject: z.string().min(1, "L'objet est requis"),
  message: z.string().min(1, "Le message est requis"),
  includeOriginal: z.boolean().optional().default(false)
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return withAdmin(async (request: NextRequest) => {
    try {
      const body = await request.json()
      
      // Validate input
      const validatedData = replySchema.parse(body)
      
      await connectToDatabase()

      // Get the contact
      const contact = await Contact.findById(id)
      if (!contact) {
        return NextResponse.json(
          { success: false, error: 'Message non trouvé' },
          { status: 404 }
        )
      }

      // Send templated admin reply email
      const emailSent = await sendAdminReplyEmail(
        contact.email,
        contact.name,
        contact.subject,
        validatedData.message,
        validatedData.includeOriginal ? contact.message : '',
        contact._id.toString()
      )

      if (!emailSent) {
        return NextResponse.json(
          { success: false, error: 'Erreur lors de l\'envoi de l\'email' },
          { status: 500 }
        )
      }

    // Update contact status to replied
    contact.status = 'replied'
    contact.repliedAt = new Date()
    await contact.save()

    return NextResponse.json({
      success: true,
      message: 'Réponse envoyée avec succès'
    })

  } catch (error) {
    console.error('Error sending reply:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Données invalides', 
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      )
    }
    
          return NextResponse.json(
        { success: false, error: 'Erreur lors de l\'envoi de la réponse' },
        { status: 500 }
      )
    }
  })(request)
} 