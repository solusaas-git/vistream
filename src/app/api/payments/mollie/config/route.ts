import { NextRequest, NextResponse } from 'next/server'
import { MollieService } from '@/lib/mollie'

export async function GET(request: NextRequest) {
  try {
    // Get active Mollie gateway configuration
    const gateway = await MollieService.getActiveGateway()
    
    if (!gateway.configuration?.mollieApiKey) {
      return NextResponse.json(
        { success: false, error: 'Clé API Mollie non configurée' },
        { status: 400 }
      )
    }

    // Extract profile ID from API key or get it from configuration
    let profileId = gateway.configuration.mollieProfileId
    
    // If no profile ID stored, try to get it from Mollie API
    if (!profileId) {
      try {
        const mollieService = new MollieService(
          gateway.configuration.mollieApiKey,
          gateway.configuration.mollieTestMode ?? true
        )
        
        // Get current profile from Mollie API
        const response = await fetch('https://api.mollie.com/v2/profiles/me', {
          headers: {
            'Authorization': `Bearer ${gateway.configuration.mollieApiKey}`,
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const profile = await response.json()
          profileId = profile.id
          
          // Optionally save the profile ID to the gateway configuration
          // gateway.configuration.mollieProfileId = profileId
          // await gateway.save()
        }
      } catch (error) {
        console.error('Error fetching Mollie profile:', error)
      }
    }

    if (!profileId) {
      return NextResponse.json(
        { success: false, error: 'Profile ID Mollie non trouvé' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      profileId: profileId,
      testMode: gateway.configuration.mollieTestMode ?? true
    })

  } catch (error) {
    console.error('Error fetching Mollie config:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération de la configuration Mollie' },
      { status: 500 }
    )
  }
} 