interface OfframpURLParams {
  asset: string;
  amount: string;
  network: string;
  cashoutMethod: string;
  address: string;
  sessionToken: string; // Now required
  redirectUrl?: string;
}

/**
 * Generate secure Coinbase Offramp URL with session token
 */
export function generateOfframpURL(params: OfframpURLParams): string {
  const {
    asset,
    amount,
    network,
    cashoutMethod,
    address,
    sessionToken,
    redirectUrl = process.env.NEXT_PUBLIC_OFFRAMP_REDIRECT_URL || `${process.env.NEXT_PUBLIC_APP_URL}/offramp/success`,
  } = params;

  const baseUrl = "https://pay.coinbase.com/v3/sell/input";
  const queryParams = new URLSearchParams();

  // Always use session token (secure mode)
  queryParams.append("sessionToken", sessionToken);
  
  // Optional UI parameters that work with session tokens
  if (asset) queryParams.append("defaultAsset", asset);
  if (network) queryParams.append("defaultNetwork", network);
  if (cashoutMethod) queryParams.append("defaultCashoutMethod", cashoutMethod);
  if (amount && parseFloat(amount) > 0) {
    queryParams.append("presetFiatAmount", amount);
  }
  
  // Partner user ID (truncated address)
  queryParams.append("partnerUserId", address.substring(0, 49));
  
  // Redirect URL (must match CDP project configuration)
  queryParams.append("redirectUrl", redirectUrl);

  return `${baseUrl}?${queryParams.toString()}`;
}

/**
 * Generate session token for secure offramp
 */
export async function generateOfframpSessionToken(address: string): Promise<string> {
  const response = await fetch('/api/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      addresses: [{
        address,
        blockchains: ['base']
      }],
      assets: ['USDC']
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate session token');
  }

  const data = await response.json();
  
  if (!data.success || !data.token) {
    throw new Error('Invalid session token response');
  }
  
  return data.token;
}
