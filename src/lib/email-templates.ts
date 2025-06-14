import fs from 'fs'
import path from 'path'
import juice from 'juice'

/**
 * Système de templates d'email pour Vistream
 * 
 * CHANGEMENTS RÉCENTS :
 * - Réactivation de juice pour tous les templates (compatibilité clients email)
 * - Retour au template de base original (base.html) avec tous les styles CSS
 * - Styles du header modifiés : fond clair (#f0f9ff) avec texte sombre pour éviter les conflits
 * - Configuration juice optimisée pour préserver les styles !important
 * 
 * TEMPLATES DISPONIBLES :
 * - welcome.html : Email de bienvenue
 * - password-reset.html : Réinitialisation de mot de passe  
 * - otp-verification.html : Vérification OTP
 * - smtp-test.html : Test de configuration SMTP
 */

interface TemplateData {
  [key: string]: string | number | boolean
}

interface EmailTemplate {
  subject: string
  html: string
}

// Cache pour les templates
const templateCache = new Map<string, string>()

// Fonction pour lire un template depuis le système de fichiers
function readTemplate(templateName: string): string {
  const cacheKey = templateName
  
  // Vérifier le cache d'abord
  if (templateCache.has(cacheKey)) {
    return templateCache.get(cacheKey)!
  }
  
  try {
    const templatePath = path.join(process.cwd(), 'src', 'templates', 'email', `${templateName}.html`)
    const basePath = path.join(process.cwd(), 'src', 'templates', 'email', 'base.html')
    
    // Lire le template de base et le template spécifique
    const baseTemplate = fs.readFileSync(basePath, 'utf-8')
    const contentTemplate = fs.readFileSync(templatePath, 'utf-8')
    
    // Combiner le template de base avec le contenu
    const combinedTemplate = baseTemplate.replace('{{content}}', contentTemplate)
    
    // Mettre en cache
    templateCache.set(cacheKey, combinedTemplate)
    
    return combinedTemplate
  } catch (error) {
    console.error(`Error reading template ${templateName}:`, error)
    throw new Error(`Template ${templateName} not found`)
  }
}

// Fonction pour remplacer les variables dans le template
function replaceVariables(template: string, data: TemplateData): string {
  let result = template
  
  // Remplacer toutes les variables {{variable}}
  Object.keys(data).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(regex, String(data[key]))
  })
  
  return result
}

// Fonction pour appliquer l'inline styling avec juice
function applyInlineStyles(html: string): string {
  try {
    return juice(html, {
      removeStyleTags: false, // Garder les styles CSS pour compatibilité
      preserveMediaQueries: true,
      preserveFontFaces: true,
      preserveImportant: true, // Préserver les !important
      inlinePseudoElements: true,
      webResources: {
        relativeTo: path.join(process.cwd(), 'src', 'templates', 'email'),
        strict: false
      }
    })
  } catch (error) {
    console.error('Error applying inline styles:', error)
    // Retourner le HTML original si juice échoue
    return html
  }
}

// Fonction alternative sans juice pour les templates problématiques
function applyInlineStylesSimple(html: string): string {
  // Retourner le HTML tel quel, en comptant sur les styles inline déjà présents
  return html
}

// Template de bienvenue
export function generateWelcomeEmail(data: {
  firstName: string
  lastName: string
  dashboardUrl?: string
  subscription?: {
    planName: string
    planPrice: string
    planPeriod: string
    startDate: string
    endDate?: string
  }
}): EmailTemplate {
  // Générer le contenu conditionnel pour l'abonnement
  let subscriptionDetails = ''
  let subscriptionTip = 'Choisissez un plan pour débloquer toutes les fonctionnalités'
  let noSubscriptionAlert = ''

  if (data.subscription) {
    subscriptionDetails = `
      <div class="info-box" style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
        <h3 style="margin: 0 0 10px 0; color: #22c55e; font-size: 18px; font-weight: 600;">✅ Votre abonnement ${data.subscription.planName}</h3>
        <ul style="margin: 0; padding-left: 20px; color: #666666;">
          <li style="margin-bottom: 5px;"><strong>Plan :</strong> ${data.subscription.planName}</li>
          <li style="margin-bottom: 5px;"><strong>Prix :</strong> ${data.subscription.planPrice}/${data.subscription.planPeriod}</li>
          <li style="margin-bottom: 5px;"><strong>Statut :</strong> <span style="color: #22c55e; font-weight: bold;">Actif</span></li>
          <li style="margin-bottom: 5px;"><strong>Date de début :</strong> ${data.subscription.startDate}</li>
          ${data.subscription.endDate ? `<li style="margin-bottom: 5px;"><strong>Prochaine facturation :</strong> ${data.subscription.endDate}</li>` : ''}
        </ul>
      </div>
    `
    subscriptionTip = `Profitez de toutes les fonctionnalités de votre plan ${data.subscription.planName}`
  } else {
    noSubscriptionAlert = `
      <div class="alert-box" style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <h4 style="margin: 0 0 10px 0; color: #d97706; font-size: 16px; font-weight: 600;">🎯 Choisissez votre plan</h4>
        <p style="margin: 0; color: #666666;">Vous n'avez pas encore sélectionné de plan d'abonnement. Découvrez nos offres pour profiter pleinement de Vistream !</p>
        <div style="text-align: center; margin: 15px 0 0 0;">
          <a href="${process.env.APP_URL || 'https://vistream.com'}/pricing" style="display: inline-block; padding: 10px 20px; background-color: #f59e0b; color: white !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
            Voir nos plans
          </a>
        </div>
      </div>
    `
  }

  const templateData: TemplateData = {
    title: 'Bienvenue sur Vistream',
    firstName: data.firstName,
    lastName: data.lastName,
    dashboardUrl: data.dashboardUrl || `${process.env.APP_URL || 'https://vistream.com'}/dashboard`,
    subscriptionDetails,
    subscriptionTip,
    noSubscriptionAlert
  }
  
  const template = readTemplate('welcome')
  const htmlWithData = replaceVariables(template, templateData)
  const finalHtml = applyInlineStyles(htmlWithData)
  
  return {
    subject: 'Bienvenue sur Vistream !',
    html: finalHtml
  }
}

// Template de réinitialisation de mot de passe
export function generatePasswordResetEmail(data: {
  firstName: string
  resetUrl: string
}): EmailTemplate {
  const templateData: TemplateData = {
    title: 'Réinitialisation de votre mot de passe',
    firstName: data.firstName,
    resetUrl: data.resetUrl
  }
  
  const template = readTemplate('password-reset')
  const htmlWithData = replaceVariables(template, templateData)
  const finalHtml = applyInlineStyles(htmlWithData)
  
  return {
    subject: 'Réinitialisation de votre mot de passe Vistream',
    html: finalHtml
  }
}

// Template de vérification OTP
export function generateOTPEmail(data: {
  firstName: string
  otp: string
}): EmailTemplate {
  const templateData: TemplateData = {
    title: 'Activez votre compte Vistream',
    firstName: data.firstName,
    otp: data.otp
  }
  
  const template = readTemplate('otp-verification')
  const htmlWithData = replaceVariables(template, templateData)
  const finalHtml = applyInlineStyles(htmlWithData)
  
  return {
    subject: 'Activez votre compte Vistream',
    html: finalHtml
  }
}

// Template de test SMTP
export function generateSmtpTestEmail(data: {
  smtpName: string
  smtpHost: string
  smtpPort: number
  smtpSecurity: string
  smtpUsername: string
  fromEmail: string
  testEmail: string
  adminUrl?: string
}): EmailTemplate {
  const now = new Date()
  const templateData: TemplateData = {
    title: 'Test SMTP Vistream',
    smtpName: data.smtpName,
    smtpHost: data.smtpHost,
    smtpPort: data.smtpPort,
    smtpSecurity: data.smtpSecurity,
    smtpUsername: data.smtpUsername,
    fromEmail: data.fromEmail,
    testDate: now.toLocaleDateString('fr-FR'),
    testTime: now.toLocaleTimeString('fr-FR'),
    testEmail: data.testEmail,
    adminUrl: data.adminUrl || `${process.env.APP_URL || 'https://vistream.com'}/admin/settings`
  }
  
  const template = readTemplate('smtp-test')
  const htmlWithData = replaceVariables(template, templateData)
  const finalHtml = applyInlineStyles(htmlWithData)
  
  return {
    subject: `✅ Test SMTP réussi - ${data.smtpName}`,
    html: finalHtml
  }
}

// Fonction générique pour créer des templates personnalisés
export function generateCustomEmail(data: {
  templateName: string
  subject: string
  variables: TemplateData
}): EmailTemplate {
  const templateData: TemplateData = {
    title: data.subject,
    ...data.variables
  }
  
  const template = readTemplate(data.templateName)
  const htmlWithData = replaceVariables(template, templateData)
  const finalHtml = applyInlineStyles(htmlWithData)
  
  return {
    subject: data.subject,
    html: finalHtml
  }
}

// Fonction pour vider le cache des templates (utile en développement)
export function clearTemplateCache(): void {
  templateCache.clear()
  console.log('Template cache cleared')
}

// Fonction pour précharger tous les templates
export function preloadTemplates(): void {
  const templates = ['welcome', 'password-reset', 'otp-verification', 'smtp-test']
  
  templates.forEach(template => {
    try {
      readTemplate(template)
      console.log(`✅ Template ${template} preloaded`)
    } catch (error) {
      console.error(`❌ Failed to preload template ${template}:`, error)
    }
  })
} 