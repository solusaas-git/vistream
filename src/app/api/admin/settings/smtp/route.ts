import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectToDatabase from '@/lib/mongoose'
import SmtpSettings from '@/models/SmtpSettings'
import { withAdmin } from '@/lib/rbac'
import { rateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit'

const smtpSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(100, "Le nom ne peut pas dépasser 100 caractères"),
  host: z.string().min(1, "L'hôte est requis"),
  port: z.number().min(1, "Le port doit être supérieur à 0").max(65535, "Le port ne peut pas dépasser 65535"),
  secure: z.boolean(),
  username: z.string().min(1, "Le nom d'utilisateur est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
  fromEmail: z.string().email("Veuillez entrer une adresse email valide"),
  fromName: z.string().min(1, "Le nom d'expéditeur est requis").max(100, "Le nom d'expéditeur ne peut pas dépasser 100 caractères"),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional()
})

// GET /api/admin/settings/smtp - Get all SMTP settings
export const GET = withAdmin(async (request: NextRequest) => {
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

    const smtpSettings = await SmtpSettings.find({})
      .select('-password') // Ne pas retourner les mots de passe
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      data: smtpSettings
    })

  } catch (error) {
    console.error('Error fetching SMTP settings:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des paramètres SMTP' },
      { status: 500 }
    )
  }
})

// POST /api/admin/settings/smtp - Create new SMTP settings
export const POST = withAdmin(async (request: NextRequest) => {
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
    const validatedData = smtpSchema.parse(body)
    
    await connectToDatabase()

    // Créer le nouveau paramètre SMTP
    const smtpSettings = new SmtpSettings(validatedData)
    await smtpSettings.save()

    // Retourner sans le mot de passe
    const { password, ...smtpWithoutPassword } = smtpSettings.toObject()

    return NextResponse.json({
      success: true,
      message: 'Paramètres SMTP créés avec succès',
      data: smtpWithoutPassword
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating SMTP settings:', error)
    
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
      { success: false, error: 'Erreur lors de la création des paramètres SMTP' },
      { status: 500 }
    )
  }
}) 