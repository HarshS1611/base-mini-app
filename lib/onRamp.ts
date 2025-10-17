/**
 * Parameters for generating Coinbase Onramp URL
 */
interface OnrampURLParams {
  sessionToken: string; // Now required for secure mode
  presetFiatAmount?: number;
  fiatCurrency?: string;
  defaultNetwork?: string;
  defaultAsset?: string;
  defaultPaymentMethod?: string;
  partnerUserId?: string;
  redirectUrl?: string;
}

/**
 * Generate Coinbase Onramp URL (compatible with OnchainKit event listeners)
 * This function generates URLs that work with setupOnrampEventListeners
 */
export function generateOnrampURL(params: OnrampURLParams): string {
  const {
    sessionToken,
    presetFiatAmount,
    fiatCurrency = 'USD',
    defaultNetwork = 'base',
    defaultAsset = 'USDC',
    defaultPaymentMethod,
    partnerUserId,
    redirectUrl,
  } = params;

  if (!sessionToken) {
    throw new Error('Session token is required for secure onramp initialization');
  }

  const baseUrl = 'https://pay.coinbase.com/buy/select-asset';
  const queryParams = new URLSearchParams();

  // Session token (required)
  queryParams.append('sessionToken', sessionToken);

  // Optional parameters
  if (presetFiatAmount && presetFiatAmount > 0) {
    queryParams.append('presetFiatAmount', presetFiatAmount.toString());
  }
  
  if (fiatCurrency) {
    queryParams.append('fiatCurrency', fiatCurrency);
  }

  if (defaultNetwork) {
    queryParams.append('defaultNetwork', defaultNetwork);
  }

  if (defaultAsset) {
    queryParams.append('defaultAsset', defaultAsset);
  }

  if (defaultPaymentMethod) {
    queryParams.append('defaultPaymentMethod', defaultPaymentMethod.toUpperCase());
  }

  if (partnerUserId) {
    queryParams.append('partnerUserId', partnerUserId.substring(0, 49));
  }

  if (redirectUrl) {
    queryParams.append('redirectUrl', redirectUrl);
  }

  const finalUrl = `${baseUrl}?${queryParams.toString()}`;
  console.log('🔗 Generated onramp URL (compatible with OnchainKit events)');
  
  return finalUrl;
}

/**
 * Generate session token for secure onramp
 * @param address - User's wallet address
 * @param options - Additional options for session token generation
 */
export async function generateOnrampSessionToken(
  address: string,
  options?: {
    blockchains?: string[];
    assets?: string[];
  }
): Promise<string> {
  try {
    console.log('🔄 Requesting session token for onramp...');
    
    const response = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addresses: [{
          address,
          blockchains: options?.blockchains || ['base'],
        }],
        assets: options?.assets || ['USDC'],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('📥 Session token response:', {
      success: data.success,
      hasToken: !!data.token,
      tokenLength: data.token?.length,
    });

    if (!data.success) {
      throw new Error(data.error || 'Session token generation failed');
    }
    
    if (!data.token) {
      throw new Error('No token received from API');
    }

    console.log('✅ Session token generated successfully');
    return data.token;
    
  } catch (error) {
    console.error('❌ Session token request failed:', error);
    throw error; // Re-throw to handle in component
  }
}

/**
 * Helper function to create OnchainKit-compatible onramp URL with all parameters
 */
export async function createOnrampUrl(
  address: string,
  amount?: number,
  options?: {
    network?: string;
    asset?: string;
    paymentMethod?: string;
    redirectUrl?: string;
    blockchains?: string[];
    assets?: string[];
  }
): Promise<string> {
  // Generate session token
  const sessionToken = await generateOnrampSessionToken(address, {
    blockchains: options?.blockchains,
    assets: options?.assets,
  });

  // Generate onramp URL
  const url = generateOnrampURL({
    sessionToken,
    presetFiatAmount: amount,
    fiatCurrency: 'USD',
    defaultNetwork: options?.network || 'base',
    defaultAsset: options?.asset || 'USDC',
    defaultPaymentMethod: options?.paymentMethod,
    partnerUserId: address,
    redirectUrl: options?.redirectUrl || 
      process.env.NEXT_PUBLIC_ONRAMP_REDIRECT_URL || 
      `${process.env.NEXT_PUBLIC_APP_URL}/onramp/success`,
  });

  return url;
}
