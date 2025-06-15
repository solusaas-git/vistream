import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/rbac'
import connectToDatabase from '@/lib/mongoose'
import PaymentGateway from '@/models/PaymentGateway'

// POST - Test payment gateway connection
export async function POST(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user || !['admin', 'user'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    // Await params in Next.js 15
    const { id } = await params
    const gateway = await PaymentGateway.findById(id)
      .select('+configuration.mollieApiKey +configuration.paypalClientSecret +configuration.stripeSecretKey')
    
    if (!gateway) {
      return NextResponse.json(
        { success: false, error: 'Passerelle de paiement non trouvée' },
        { status: 404 }
      )
    }

    let testResult = { success: false, message: 'Test non implémenté pour ce fournisseur' }

    try {
      switch (gateway.provider) {
        case 'mollie':
          testResult = await testMollieConnection(gateway.configuration)
          break
        case 'paypal':
          testResult = await testPayPalConnection(gateway.configuration)
          break
        case 'stripe':
          testResult = await testStripeConnection(gateway.configuration)
          break
        default:
          testResult = { success: false, message: 'Fournisseur non supporté pour les tests' }
      }
    } catch (error) {
      testResult = { success: false, message: `Erreur lors du test: ${error.message}` }
    }

    // Update gateway with test results
    gateway.testResults = {
      success: testResult.success,
      message: testResult.message,
      testedAt: new Date()
    }
    gateway.lastTestedAt = new Date()
    await gateway.save()

    return NextResponse.json({
      success: true,
      testResult,
      message: testResult.success ? 'Test réussi' : 'Test échoué'
    })

  } catch (error) {
    console.error('Error testing payment gateway:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors du test de la passerelle de paiement' },
      { status: 500 }
    )
  }
}

// Test Mollie connection
async function testMollieConnection(config) {
  if (!config.mollieApiKey) {
    return { success: false, message: 'Clé API Mollie manquante' }
  }

  try {
    const response = await fetch('https://api.mollie.com/v2/methods', {
      headers: {
        'Authorization': `Bearer ${config.mollieApiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      return { 
        success: true, 
        message: `Connexion réussie. ${data.count || 0} méthodes de paiement disponibles.` 
      }
    } else {
      const error = await response.json()
      return { 
        success: false, 
        message: `Erreur Mollie: ${error.detail || 'Connexion échouée'}` 
      }
    }
  } catch (error) {
    return { success: false, message: `Erreur de connexion Mollie: ${error.message}` }
  }
}

// Test PayPal connection
async function testPayPalConnection(config) {
  if (!config.paypalClientId || !config.paypalClientSecret) {
    return { success: false, message: 'Identifiants PayPal manquants' }
  }

  try {
    const baseUrl = config.paypalSandbox 
      ? 'https://api.sandbox.paypal.com' 
      : 'https://api.paypal.com'

    // Get access token
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${Buffer.from(`${config.paypalClientId}:${config.paypalClientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    })

    if (authResponse.ok) {
      return { 
        success: true, 
        message: `Connexion PayPal réussie (${config.paypalSandbox ? 'Sandbox' : 'Production'})` 
      }
    } else {
      const error = await authResponse.json()
      return { 
        success: false, 
        message: `Erreur PayPal: ${error.error_description || 'Authentification échouée'}` 
      }
    }
  } catch (error) {
    return { success: false, message: `Erreur de connexion PayPal: ${error.message}` }
  }
}

// Test Stripe connection
async function testStripeConnection(config) {
  if (!config.stripeSecretKey) {
    return { success: false, message: 'Clé secrète Stripe manquante' }
  }

  try {
    const response = await fetch('https://api.stripe.com/v1/payment_methods', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    if (response.ok) {
      return { 
        success: true, 
        message: `Connexion Stripe réussie (${config.stripeTestMode ? 'Test' : 'Production'})` 
      }
    } else {
      const error = await response.json()
      return { 
        success: false, 
        message: `Erreur Stripe: ${error.error?.message || 'Connexion échouée'}` 
      }
    }
  } catch (error) {
    return { success: false, message: `Erreur de connexion Stripe: ${error.message}` }
  }
} 