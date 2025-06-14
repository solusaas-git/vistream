import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectToDatabase from '@/lib/mongoose'
import SmtpSettings from '@/models/SmtpSettings'
import { withAdmin } from '@/lib/rbac'
import { rateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit'

const updateSmtpSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100, "Le nom ne peut pas dépasser 100 caractères").optional(),
  host: z.string().min(1, "L'hôte est requis").optional(),
  port: z.number().min(1, "Le port doit être supérieur à 0").max(65535, "Le port ne peut pas dépasser 65535").optional(),
  secure: z.boolean().optional(),
  username: z.string().min(1, "Le nom d'utilisateur est requis").optional(),
  password: z.string().min(1, "Le mot de passe est requis").optional(),
  fromEmail: z.string().email("Veuillez entrer une adresse email valide").optional(),
  fromName: z.string().min(1, "Le nom d'expéditeur est requis").max(100, "Le nom d'expéditeur ne peut pas dépasser 100 caractères").optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional()
})

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// PUT /api/admin/settings/smtp/[id] - Update SMTP settings
export const PUT = withAdmin(async (request: NextRequest, user, { params }: RouteParams) => {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, rateLimitConfigs.default)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitResponse(rateLimitResult.resetTime),
        { status: 429 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const validatedData = updateSmtpSchema.parse(body)
    
    await connectToDatabase()
    
    const { id } = await params
    
    // Check if SMTP settings exist
    const smtpSettings = await SmtpSettings.findById(id)
    if (!smtpSettings) {
      return NextResponse.json(
        { success: false, error: 'Paramètres SMTP non trouvés' },
        { status: 404 }
      )
    }
    
    // Update SMTP settings using save() to trigger middleware
    Object.assign(smtpSettings, validatedData)
    const updatedSmtp = await smtpSettings.save()
    
    // Remove password from response
    const responseData = updatedSmtp.toObject()
    delete responseData.password
    
    return NextResponse.json({
      success: true,
      message: 'Paramètres SMTP mis à jour avec succès',
      data: responseData
    })
    
  } catch (error) {
    console.error('Error updating SMTP settings:', error)
    
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
      { success: false, error: 'Erreur lors de la mise à jour des paramètres SMTP' },
      { status: 500 }
    )
  }
})

// DELETE /api/admin/settings/smtp/[id] - Delete SMTP settings
export const DELETE = withAdmin(async (request: NextRequest, user, { params }: RouteParams) => {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(request, rateLimitConfigs.default)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitResponse(rateLimitResult.resetTime),
        { status: 429 }
      )
    }

    await connectToDatabase()

    const { id } = await params
    
    // Check if SMTP settings exist
    const smtpSettings = await SmtpSettings.findById(id)
    if (!smtpSettings) {
      return NextResponse.json(
        { success: false, error: 'Paramètres SMTP non trouvés' },
        { status: 404 }
      )
    }

    // Delete SMTP settings
    await SmtpSettings.findByIdAndDelete(id)
    
    return NextResponse.json({
      success: true,
      message: 'Paramètres SMTP supprimés avec succès'
    })
    
  } catch (error) {
    console.error('Error deleting SMTP settings:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression des paramètres SMTP' },
      { status: 500 }
    )
  }
}) 