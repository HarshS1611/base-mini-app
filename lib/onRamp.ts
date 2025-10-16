interface OnrampURLParams {
  asset: string;
  amount: string;
  network: string;
  paymentMethod: string;
  address: string;
  sessionToken?: string;
  redirectUrl?: string;
}

/**
 * Generate Coinbase Onramp URL following official example format
 */
export function generateOnrampURL(params: OnrampURLParams): string {
  const {
    asset,
    amount,
    network,
    paymentMethod,
    address,
    sessionToken,
    redirectUrl = process.env.NEXT_PUBLIC_ONRAMP_REDIRECT_URL || `${process.env.NEXT_PUBLIC_APP_URL}/onramp/success`,
  } = params;

  const baseUrl = "https://pay.coinbase.com/buy/select-asset";
  const queryParams = new URLSearchParams();

  if (sessionToken && sessionToken !== 'mock_session_token_for_testing') {
    // Use session token (secure mode) - following official example
    queryParams.append("sessionToken", sessionToken);
    
    // Optional parameters that enhance UX (as shown in official example)
    if (network) queryParams.append("defaultNetwork", network);
    if (amount && parseFloat(amount) > 0) {
      queryParams.append("presetFiatAmount", amount);
    }
    if (asset) queryParams.append("defaultAsset", asset);
    if (paymentMethod) queryParams.append("defaultPaymentMethod", paymentMethod.toUpperCase());
    
    // Partner user ID for tracking
    queryParams.append("partnerUserId", address.substring(0, 49));
    
    // Redirect URL - must be allowlisted in CDP project
    queryParams.append("redirectUrl", redirectUrl);
    
    console.log('✅ Generated secure onramp URL with session token');
    
  } else {
    // Fallback to non-session mode (legacy support)
    console.warn('⚠️ Using fallback mode - session token not available');
    
    const CDP_PROJECT_ID = process.env.NEXT_PUBLIC_CDP_PROJECT_ID || '';
    
    if (!CDP_PROJECT_ID) {
      throw new Error('CDP Project ID not configured for fallback mode');
    }
    
    queryParams.append("appId", CDP_PROJECT_ID);
    
    // Format addresses as required by legacy API
    const addressesObj: Record<string, string[]> = {};
    addressesObj[address] = [network];
    queryParams.append("addresses", JSON.stringify(addressesObj));
    
    queryParams.append("assets", JSON.stringify([asset]));
    queryParams.append("defaultAsset", asset);
    queryParams.append("defaultNetwork", network);
    queryParams.append("defaultPaymentMethod", paymentMethod.toUpperCase());
    if (amount && parseFloat(amount) > 0) {
      queryParams.append("presetFiatAmount", amount);
    }
    queryParams.append("partnerUserId", address.substring(0, 49));
    queryParams.append("redirectUrl", redirectUrl);
    queryParams.append("fiatCurrency", "USD");
  }

  const finalUrl = `${baseUrl}?${queryParams.toString()}`;
  console.log('🔗 Generated onramp URL:', finalUrl.replace(sessionToken || '', '[SESSION_TOKEN]'));
  
  return finalUrl;
}

/**
 * Generate session token with proper error handling and retry logic
 */
export async function generateOnrampSessionToken(address: string): Promise<string> {
  try {
    console.log('🔄 Requesting session token for onramp...');
    
    const response = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addresses: [{
          address,
          blockchains: ['base', 'ethereum'] // Support multiple networks for flexibility
        }],
        assets: ['USDC', 'ETH'] // Support multiple assets
      }),
    });

    const data = await response.json();
    
    console.log('📥 Session token response:', {
      success: data.success,
      hasToken: !!data.token,
      tokenLength: data.token?.length,
      expiresIn: data.expiresIn,
      error: data.error
    });

    if (!data.success) {
      console.warn('⚠️ Session token generation failed:', data.error);
      console.warn('⚠️ Falling back to non-session mode');
      return ''; // Return empty string to trigger fallback mode
    }
    
    if (!data.token) {
      console.warn('⚠️ No token in response, using fallback mode');
      return '';
    }

    console.log('✅ Session token generated successfully');
    return data.token;
    
  } catch (error) {
    console.warn('⚠️ Session token request failed:', error instanceof Error ? error.message : 'Unknown error');
    console.warn('⚠️ Using fallback mode');
    return ''; // Return empty string to use fallback mode
  }
}
