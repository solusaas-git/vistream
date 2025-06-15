import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/rbac'
import connectToDatabase from '@/lib/mongoose'
import PaymentGateway from '@/models/PaymentGateway'

// GET - Fetch all payment gateways
export async function GET(request) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user || !['admin', 'user'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 401 }
      )
    }

    await connectToDatabase()

    const gateways = await PaymentGateway.find({})
      .select('+configuration.mollieApiKey +configuration.paypalClientSecret +configuration.stripeSecretKey +configuration.webhookSecret')
      .sort({ createdAt: -1 })

    // Mask sensitive data for response
    const maskedGateways = gateways.map(gateway => {
      const gatewayObj = gateway.toObject()
      
      // Mask sensitive configuration fields
      if (gatewayObj.configuration) {
        if (gatewayObj.configuration.mollieApiKey) {
          gatewayObj.configuration.mollieApiKey = gatewayObj.configuration.mollieApiKey.replace(/(.{4}).*(.{4})/, '$1****$2')
        }
        if (gatewayObj.configuration.paypalClientSecret) {
          gatewayObj.configuration.paypalClientSecret = gatewayObj.configuration.paypalClientSecret.replace(/(.{4}).*(.{4})/, '$1****$2')
        }
        if (gatewayObj.configuration.stripeSecretKey) {
          gatewayObj.configuration.stripeSecretKey = gatewayObj.configuration.stripeSecretKey.replace(/(.{4}).*(.{4})/, '$1****$2')
        }
        if (gatewayObj.configuration.webhookSecret) {
          gatewayObj.configuration.webhookSecret = '****'
        }
      }
      
      return gatewayObj
    })

    return NextResponse.json({
      success: true,
      data: maskedGateways
    })

  } catch (error) {
    console.error('Error fetching payment gateways:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des passerelles de paiement' },
      { status: 500 }
    )
  }
}

// POST - Create new payment gateway
export async function POST(request) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user || !['admin', 'user'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 401 }
      )
    }

    const data = await request.json()
    
    // Validate required fields
    if (!data.name || !data.provider || !data.displayName) {
      return NextResponse.json(
        { success: false, error: 'Nom, fournisseur et nom d\'affichage sont requis' },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Check if gateway with same provider already exists
    const existingGateway = await PaymentGateway.findOne({ provider: data.provider })
    if (existingGateway) {
      return NextResponse.json(
        { success: false, error: `Une passerelle ${data.provider} existe déjà` },
        { status: 400 }
      )
    }

    // Create configuration object based on provider
    const configuration = {}
    
    switch (data.provider) {
      case 'mollie':
        configuration.mollieApiKey = data.configuration?.mollieApiKey || ''
        configuration.mollieTestMode = data.configuration?.mollieTestMode ?? true
        break
      case 'paypal':
        configuration.paypalClientId = data.configuration?.paypalClientId || ''
        configuration.paypalClientSecret = data.configuration?.paypalClientSecret || ''
        configuration.paypalSandbox = data.configuration?.paypalSandbox ?? true
        break
      case 'stripe':
        configuration.stripePublishableKey = data.configuration?.stripePublishableKey || ''
        configuration.stripeSecretKey = data.configuration?.stripeSecretKey || ''
        configuration.stripeTestMode = data.configuration?.stripeTestMode ?? true
        break
    }
    
    configuration.webhookUrl = data.configuration?.webhookUrl || ''
    configuration.webhookSecret = data.configuration?.webhookSecret || ''
    configuration.additionalSettings = data.configuration?.additionalSettings || {}

    const gateway = new PaymentGateway({
      name: data.name,
      provider: data.provider,
      displayName: data.displayName,
      description: data.description || '',
      configuration,
      supportedCurrencies: data.supportedCurrencies || ['EUR', 'USD'],
      supportedPaymentMethods: data.supportedPaymentMethods || ['credit_card'],
      fees: {
        fixedFee: data.fees?.fixedFee || 0,
        percentageFee: data.fees?.percentageFee || 0,
        currency: data.fees?.currency || 'EUR'
      },
      limits: {
        minAmount: data.limits?.minAmount || 0.01,
        maxAmount: data.limits?.maxAmount || 10000,
        currency: data.limits?.currency || 'EUR'
      },
      status: data.status || 'inactive',
      createdBy: user.userId
    })

    await gateway.save()

    return NextResponse.json({
      success: true,
      message: 'Passerelle de paiement créée avec succès',
      data: gateway
    })

  } catch (error) {
    console.error('Error creating payment gateway:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création de la passerelle de paiement' },
      { status: 500 }
    )
  }
} 