import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/rbac'
import connectToDatabase from '@/lib/mongoose'
import PaymentGateway from '@/models/PaymentGateway'

// GET - Fetch specific payment gateway
export async function GET(request, { params }) {
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
      .select('+configuration.mollieApiKey +configuration.paypalClientSecret +configuration.stripeSecretKey +configuration.webhookSecret')

    if (!gateway) {
      return NextResponse.json(
        { success: false, error: 'Passerelle de paiement non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: gateway
    })

  } catch (error) {
    console.error('Error fetching payment gateway:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération de la passerelle de paiement' },
      { status: 500 }
    )
  }
}

// PUT - Update payment gateway
export async function PUT(request, { params }) {
  try {
    const user = await getAuthenticatedUser(request)
    
    if (!user || !['admin', 'user'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Accès non autorisé' },
        { status: 401 }
      )
    }

    const data = await request.json()
    
    await connectToDatabase()

    // Await params in Next.js 15
    const { id } = await params
    const gateway = await PaymentGateway.findById(id)
    if (!gateway) {
      return NextResponse.json(
        { success: false, error: 'Passerelle de paiement non trouvée' },
        { status: 404 }
      )
    }

    // Update basic fields
    if (data.name) gateway.name = data.name
    if (data.displayName) gateway.displayName = data.displayName
    if (data.description !== undefined) gateway.description = data.description
    if (data.supportedCurrencies) gateway.supportedCurrencies = data.supportedCurrencies
    if (data.supportedPaymentMethods) gateway.supportedPaymentMethods = data.supportedPaymentMethods
    if (data.status) gateway.status = data.status

    // Update fees
    if (data.fees) {
      gateway.fees = {
        fixedFee: data.fees.fixedFee ?? gateway.fees.fixedFee,
        percentageFee: data.fees.percentageFee ?? gateway.fees.percentageFee,
        currency: data.fees.currency || gateway.fees.currency
      }
    }

    // Update limits
    if (data.limits) {
      gateway.limits = {
        minAmount: data.limits.minAmount ?? gateway.limits.minAmount,
        maxAmount: data.limits.maxAmount ?? gateway.limits.maxAmount,
        currency: data.limits.currency || gateway.limits.currency
      }
    }

    // Update configuration based on provider
    if (data.configuration) {
      const config = gateway.configuration || {}
      
      switch (gateway.provider) {
        case 'mollie':
          if (data.configuration.mollieApiKey) config.mollieApiKey = data.configuration.mollieApiKey
          if (data.configuration.mollieTestMode !== undefined) config.mollieTestMode = data.configuration.mollieTestMode
          break
        case 'paypal':
          if (data.configuration.paypalClientId) config.paypalClientId = data.configuration.paypalClientId
          if (data.configuration.paypalClientSecret) config.paypalClientSecret = data.configuration.paypalClientSecret
          if (data.configuration.paypalSandbox !== undefined) config.paypalSandbox = data.configuration.paypalSandbox
          break
        case 'stripe':
          if (data.configuration.stripePublishableKey) config.stripePublishableKey = data.configuration.stripePublishableKey
          if (data.configuration.stripeSecretKey) config.stripeSecretKey = data.configuration.stripeSecretKey
          if (data.configuration.stripeTestMode !== undefined) config.stripeTestMode = data.configuration.stripeTestMode
          break
      }
      
      if (data.configuration.webhookUrl !== undefined) config.webhookUrl = data.configuration.webhookUrl
      if (data.configuration.webhookSecret) config.webhookSecret = data.configuration.webhookSecret
      if (data.configuration.additionalSettings) config.additionalSettings = data.configuration.additionalSettings
      
      gateway.configuration = config
    }

    gateway.updatedBy = user.userId
    await gateway.save()

    return NextResponse.json({
      success: true,
      message: 'Passerelle de paiement mise à jour avec succès',
      data: gateway
    })

  } catch (error) {
    console.error('Error updating payment gateway:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la mise à jour de la passerelle de paiement' },
      { status: 500 }
    )
  }
}

// DELETE - Delete payment gateway
export async function DELETE(request, { params }) {
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
    if (!gateway) {
      return NextResponse.json(
        { success: false, error: 'Passerelle de paiement non trouvée' },
        { status: 404 }
      )
    }

    // Check if this is the active gateway
    if (gateway.isActive) {
      return NextResponse.json(
        { success: false, error: 'Impossible de supprimer la passerelle active. Désactivez-la d\'abord.' },
        { status: 400 }
      )
    }

    await PaymentGateway.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: 'Passerelle de paiement supprimée avec succès'
    })

  } catch (error) {
    console.error('Error deleting payment gateway:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression de la passerelle de paiement' },
      { status: 500 }
    )
  }
} 