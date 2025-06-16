import nodemailer from 'nodemailer'
import connectToDatabase from './mongoose'
import SmtpSettings from '@/models/SmtpSettings'
import { 
  generateWelcomeEmail, 
  generatePasswordResetEmail, 
  generateOTPEmail,
  generateContactConfirmationEmail,
  generateAdminReplyEmail
} from './email-templates'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

// Get active SMTP configuration from database
async function getActiveSmtpConfig() {
  try {
    await connectToDatabase()
    const activeSmtp = await SmtpSettings.findOne({ isActive: true })
    
    if (!activeSmtp) {
      throw new Error('Aucun serveur SMTP actif trouvé. Veuillez configurer un serveur SMTP dans les paramètres administrateur.')
    }
    
    return {
      host: activeSmtp.host,
      port: activeSmtp.port,
      secure: activeSmtp.secure,
      auth: {
        user: activeSmtp.username,
        pass: activeSmtp.password,
      },
      from: {
        name: activeSmtp.fromName,
        address: activeSmtp.fromEmail,
      }
    }
  } catch (error) {
    console.error('Error getting active SMTP config:', error)
    throw error
  }
}

// Create transporter with active SMTP config
async function createTransporter() {
  const smtpConfig = await getActiveSmtpConfig()
  
  return nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: smtpConfig.auth,
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  })
}

// Send email
export async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  try {
    const smtpConfig = await getActiveSmtpConfig()
    const transporter = await createTransporter()
    
    const mailOptions = {
      from: `${smtpConfig.from.name} <${smtpConfig.from.address}>`,
      to,
      subject,
      html,
    }

    await transporter.sendMail(mailOptions)
    console.log(`Email sent successfully to ${to}`)
    return true
  } catch (error) {
    console.error('Email sending failed:', error)
    return false
  }
}

// Send welcome email
export async function sendWelcomeEmail(
  email: string, 
  firstName: string, 
  lastName: string,
  subscription?: {
    planName: string
    planPrice: string
    planPeriod: string
    startDate: string
    endDate?: string
  }
): Promise<boolean> {
  try {
    const emailTemplate = generateWelcomeEmail({
      firstName,
      lastName,
      dashboardUrl: `${process.env.APP_URL || 'https://vistream.com'}/dashboard`,
      subscription
    })

    return await sendEmail({ 
      to: email, 
      subject: emailTemplate.subject, 
      html: emailTemplate.html 
    })
  } catch (error) {
    console.error('Error generating welcome email:', error)
    return false
  }
}

// Send OTP email
export async function sendOTPEmail(email: string, otp: string, firstName: string): Promise<boolean> {
  try {
    const emailTemplate = generateOTPEmail({
      firstName,
      otp
    })

    return await sendEmail({ 
      to: email, 
      subject: emailTemplate.subject, 
      html: emailTemplate.html 
    })
  } catch (error) {
    console.error('Error generating OTP email:', error)
    return false
  }
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, resetToken: string, firstName: string): Promise<boolean> {
  try {
    const resetUrl = `${process.env.APP_URL || 'https://vistream.com'}/auth/reset-password?token=${resetToken}`
    
    const emailTemplate = generatePasswordResetEmail({
      firstName,
      resetUrl
    })

    return await sendEmail({ 
      to: email, 
      subject: emailTemplate.subject, 
      html: emailTemplate.html 
    })
  } catch (error) {
    console.error('Error generating password reset email:', error)
    return false
  }
}

// Send contact confirmation email
export async function sendContactConfirmationEmail(
  email: string, 
  name: string, 
  subject: string, 
  message: string, 
  messageId: string
): Promise<boolean> {
  try {
    const emailTemplate = generateContactConfirmationEmail({
      name,
      email,
      subject,
      message,
      messageId,
      date: new Date().toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    })

    return await sendEmail({ 
      to: email, 
      subject: emailTemplate.subject, 
      html: emailTemplate.html 
    })
  } catch (error) {
    console.error('Error generating contact confirmation email:', error)
    return false
  }
}

// Send admin reply email
export async function sendAdminReplyEmail(
  email: string,
  contactName: string,
  originalSubject: string,
  replyMessage: string,
  originalMessage: string,
  messageId: string
): Promise<boolean> {
  try {
    const emailTemplate = generateAdminReplyEmail({
      contactName,
      originalSubject,
      replyMessage,
      originalMessage,
      messageId,
      replyDate: new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    })

    return await sendEmail({ 
      to: email, 
      subject: emailTemplate.subject, 
      html: emailTemplate.html 
    })
  } catch (error) {
    console.error('Error generating admin reply email:', error)
    return false
  }
} 