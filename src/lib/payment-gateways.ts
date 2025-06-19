import connectToDatabase from '@/lib/mongoose'
import PaymentGateway from '@/models/PaymentGateway'

// Helper function to get gateway configuration (for server-side use)
export async function getGatewayConfig(provider: string, includeSecrets = false) {
  try {
    await connectToDatabase()

    const gateway: any = await PaymentGateway.findOne({
      provider: provider.toLowerCase(),
      isActive: true,
      status: 'active'
    })
    .select(includeSecrets ? '+configuration' : 'configuration')
    .lean()

    if (!gateway) {
      throw new Error(`Gateway ${provider} not found or inactive`)
    }

    return {
      id: gateway._id.toString(),
      provider: gateway.provider,
      configuration: gateway.configuration,
      supportedCurrencies: gateway.supportedCurrencies,
      limits: gateway.limits,
      isTestMode: gateway.configuration?.stripeTestMode || gateway.configuration?.mollieTestMode || false
    }

  } catch (error) {
    console.error(`Error getting gateway config for ${provider}:`, error)
    throw error
  }
} 