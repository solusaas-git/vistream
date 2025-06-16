import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import connectToDatabase from '@/lib/mongoose'
import Contact from '@/models/Contact'
import { rateLimit, rateLimitConfigs, createRateLimitResponse } from '@/lib/rate-limit'
import { getClientIP, isBotIP } from '@/lib/ip-utils'
import { sendContactConfirmationEmail } from '@/lib/email'

// Validation schema for contact form
const contactSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères.").max(100),
  email: z.string().email("Veuillez entrer une adresse email valide."),
  subject: z.string().min(5, "L'objet doit contenir au moins 5 caractères.").max(200),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères.").max(5000),
})

// POST /api/contact - Submit contact form
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (more restrictive for contact forms to prevent spam)
    const rateLimitResult = rateLimit(request, {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 5 // 5 contact submissions per hour per IP
    })
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitResponse(rateLimitResult.resetTime),
        { status: 429 }
      )
    }

    const body = await request.json()
    
    // Validate input
    const validatedData = contactSchema.parse(body)
    
    await connectToDatabase()
    
    // Get client information
    const clientIP = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || ''
    
    // Check for potential spam (basic checks)
    const isSpam = detectSpam(validatedData, clientIP, userAgent)
    const isBot = isBotIP(clientIP, userAgent)
    
    // Create new contact message
    const newContact = new Contact({
      name: validatedData.name,
      email: validatedData.email,
      subject: validatedData.subject,
      message: validatedData.message,
      ipAddress: clientIP,
      userAgent: userAgent,
      source: 'landing_page',
      priority: determinePriority(validatedData),
      tags: generateTags(validatedData),
      status: (isSpam || isBot) ? 'closed' : 'new' // Auto-close spam messages and bot submissions
    })
    
    // Save to database
    await newContact.save()
    
    console.log('Contact message created:', { 
      id: newContact._id, 
      email: newContact.email, 
      subject: newContact.subject,
      isSpam,
      isBot 
    })

    // Send confirmation email to user (only if not spam/bot)
    if (!isSpam && !isBot) {
      try {
        const emailSent = await sendContactConfirmationEmail(
          newContact.email,
          newContact.name,
          newContact.subject,
          newContact.message,
          newContact._id.toString()
        )
        
        if (emailSent) {
          console.log('Confirmation email sent to:', newContact.email)
        } else {
          console.warn('Failed to send confirmation email to:', newContact.email)
        }
      } catch (error) {
        console.error('Error sending confirmation email:', error)
        // Don't fail the request if email fails
      }
    }

    // TODO: Send notification email to admin team
    
    return NextResponse.json({
      success: true,
      message: 'Votre message a été envoyé avec succès. Notre équipe vous répondra sous 24h.',
      data: {
        id: newContact._id,
        status: newContact.status
      }
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error creating contact message:', error)
    
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
      { error: 'Erreur lors de l\'envoi du message. Veuillez réessayer.' },
      { status: 500 }
    )
  }
}



// Basic spam detection
function detectSpam(data: any, ip: string, userAgent: string): boolean {
  const spamKeywords = [
    'viagra', 'casino', 'lottery', 'winner', 'congratulations',
    'click here', 'free money', 'make money fast', 'work from home',
    'bitcoin', 'cryptocurrency', 'investment opportunity'
  ]
  
  const content = `${data.subject} ${data.message}`.toLowerCase()
  
  // Check for spam keywords
  const hasSpamKeywords = spamKeywords.some(keyword => content.includes(keyword))
  
  // Check for suspicious patterns
  const hasExcessiveLinks = (content.match(/http/g) || []).length > 3
  const hasExcessiveCaps = content.replace(/[^A-Z]/g, '').length > content.length * 0.3
  const hasSuspiciousEmail = data.email.includes('temp') || data.email.includes('disposable')
  
  return hasSpamKeywords || hasExcessiveLinks || hasExcessiveCaps || hasSuspiciousEmail
}

// Determine message priority based on content
function determinePriority(data: any): 'low' | 'medium' | 'high' | 'urgent' {
  const content = `${data.subject} ${data.message}`.toLowerCase()
  
  // Urgent keywords
  if (content.includes('urgent') || content.includes('emergency') || content.includes('asap')) {
    return 'urgent'
  }
  
  // High priority keywords
  if (content.includes('bug') || content.includes('error') || content.includes('problem') || 
      content.includes('issue') || content.includes('not working')) {
    return 'high'
  }
  
  // Business/sales related
  if (content.includes('enterprise') || content.includes('business') || content.includes('partnership') ||
      content.includes('demo') || content.includes('pricing')) {
    return 'high'
  }
  
  return 'medium'
}

// Generate relevant tags based on content
function generateTags(data: any): string[] {
  const content = `${data.subject} ${data.message}`.toLowerCase()
  const tags: string[] = []
  
  // Technical tags
  if (content.includes('api') || content.includes('integration')) tags.push('technique')
  if (content.includes('bug') || content.includes('error')) tags.push('bug')
  if (content.includes('feature') || content.includes('request')) tags.push('feature-request')
  
  // Business tags
  if (content.includes('pricing') || content.includes('cost')) tags.push('pricing')
  if (content.includes('demo') || content.includes('trial')) tags.push('demo')
  if (content.includes('enterprise') || content.includes('business')) tags.push('enterprise')
  if (content.includes('partnership') || content.includes('partner')) tags.push('partnership')
  
  // Support tags
  if (content.includes('help') || content.includes('support')) tags.push('support')
  if (content.includes('question') || content.includes('how to')) tags.push('question')
  
  return tags
} 