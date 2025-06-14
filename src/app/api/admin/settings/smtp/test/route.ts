import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import nodemailer from 'nodemailer'
import connectToDatabase from '@/lib/mongoose'
import SmtpSettings from '@/models/SmtpSettings'
import { withAdmin } from '@/lib/rbac'
import { rateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit'
import { generateSmtpTestEmail } from '@/lib/email-templates'

const testSmtpSchema = z.object({
  smtpId: z.string().optional(),
  testEmail: z.string().email("Veuillez entrer une adresse email valide"),
  smtpConfig: z.object({
    name: z.string(),
    host: z.string(),
    port: z.number(),
    secure: z.boolean(),
    username: z.string(),
    password: z.string(),
    fromEmail: z.string().email(),
    fromName: z.string()
  }).optional()
})

// POST /api/admin/settings/smtp/test - Test SMTP connection
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
    const { smtpId, testEmail, smtpConfig } = testSmtpSchema.parse(body)
    
    await connectToDatabase()

    let smtpSettings
    
    if (smtpId) {
      // Test avec un SMTP existant
      smtpSettings = await SmtpSettings.findById(smtpId)
      if (!smtpSettings) {
        return NextResponse.json(
          { success: false, error: 'Paramètres SMTP non trouvés' },
          { status: 404 }
        )
      }
    } else if (smtpConfig) {
      // Test avec une configuration temporaire
      smtpSettings = smtpConfig
    } else {
      return NextResponse.json(
        { success: false, error: 'Configuration SMTP requise' },
        { status: 400 }
      )
    }

    // Créer le transporteur
    const transporter = nodemailer.createTransport({
      host: smtpSettings.host,
      port: smtpSettings.port,
      secure: smtpSettings.secure,
      auth: {
        user: smtpSettings.username,
        pass: smtpSettings.password,
      },
    })

    // Vérifier la connexion
    await transporter.verify()

    // Générer l'email de test avec le template
    const emailTemplate = generateSmtpTestEmail({
      smtpName: smtpSettings.name,
      smtpHost: smtpSettings.host,
      smtpPort: smtpSettings.port,
      smtpSecurity: smtpSettings.secure ? 'SSL/TLS' : 'Non sécurisé',
      smtpUsername: smtpSettings.username,
      fromEmail: smtpSettings.fromEmail,
      testEmail: testEmail,
      adminUrl: `${process.env.APP_URL || 'https://vistream.com'}/admin/settings`
    })

    // Envoyer l'email de test
    const info = await transporter.sendMail({
      from: `${smtpSettings.fromName} <${smtpSettings.fromEmail}>`,
      to: testEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    })

    return NextResponse.json({
      success: true,
      message: 'Test SMTP réussi ! Email envoyé avec succès.',
      data: {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected
      }
    })

  } catch (error: any) {
    console.error('Error testing SMTP:', error)
    
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

    // Erreurs spécifiques de nodemailer
    let errorMessage = 'Erreur lors du test SMTP'
    if (error?.code === 'EAUTH') {
      errorMessage = 'Erreur d\'authentification. Vérifiez vos identifiants.'
    } else if (error?.code === 'ECONNECTION') {
      errorMessage = 'Impossible de se connecter au serveur SMTP. Vérifiez l\'hôte et le port.'
    } else if (error?.code === 'ESOCKET') {
      errorMessage = 'Erreur de connexion réseau. Vérifiez votre connexion internet.'
    } else if (error?.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}) 