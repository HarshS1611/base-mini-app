import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

interface SessionTokenRequest {
  addresses: Array<{
    address: string;
    blockchains: string[];
  }>;
  assets?: string[];
}

/**
 * Manual JWT generation for CDP API
 */
function generateJWT(keyName: string, privateKey: string): string {
  try {
    console.log('🔐 Generating JWT manually...');
    
    // Clean up the private key
    let cleanPrivateKey = privateKey;
    if (cleanPrivateKey.includes('\\n')) {
      cleanPrivateKey = cleanPrivateKey.replace(/\\n/g, '\n');
    }
    
    // Ensure proper PEM format
    if (!cleanPrivateKey.includes('-----BEGIN')) {
      throw new Error('Private key must be in PEM format');
    }

    // Create JWT header
    const header = {
      alg: 'ES256',
      kid: keyName,
      nonce: crypto.randomBytes(16).toString('hex'),
      typ: 'JWT'
    };

    // Create JWT payload
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: keyName,
      nbf: now,
      exp: now + 120, // 2 minutes
      sub: keyName,
      uri: 'POST /onramp/v1/token'
    };

    // Encode header and payload
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');

    // Create signature
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto.sign('sha256', Buffer.from(signingInput), {
      key: cleanPrivateKey,
      format: 'pem'
    });

    const encodedSignature = signature.toString('base64url');

    const jwt = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
    
    console.log('✅ JWT generated successfully');
    return jwt;

  } catch (error) {
    console.error('❌ JWT generation failed:', error);
    throw new Error(`JWT generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SessionTokenRequest = await request.json();
    
    if (!body.addresses || body.addresses.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'At least one address is required'
      }, { status: 400 });
    }

    console.log('🔄 Processing session token request for addresses:', body.addresses.length);

    const keyName = process.env.CDP_API_KEY_NAME;
    const keySecret = process.env.CDP_API_KEY_SECRET;

    if (!keyName || !keySecret) {
      console.error('❌ CDP credentials not configured');
      return NextResponse.json({
        success: false,
        error: 'CDP API credentials not configured',
        hint: 'Please check CDP_API_KEY_NAME and CDP_API_KEY_SECRET in .env.local'
      }, { status: 500 });
    }

    console.log('🔐 CDP credentials found, generating JWT...');

    // Generate JWT manually
    const jwt = generateJWT(keyName, keySecret);

    console.log('📡 Calling CDP API...');

    // Call Coinbase API
    const response = await fetch('https://api.developer.coinbase.com/onramp/v1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt}`,
      },
      body: JSON.stringify(body),
    });

    console.log('📡 CDP API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ CDP API failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });

      let errorMessage = `CDP API failed with status ${response.status}`;
      
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
        details: {
          status: response.status,
          statusText: response.statusText,
          response: errorText
        }
      }, { status: 500 });
    }

    const data = await response.json();
    console.log('✅ Session token received from CDP API');

    if (!data.token) {
      throw new Error('No token received from CDP API');
    }

    return NextResponse.json({
      success: true,
      token: data.token,
      channel_id: data.channel_id,
    });

  } catch (error) {
    console.error('❌ Session token generation failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Session token generation failed',
      details: process.env.NODE_ENV === 'development' ? {
        stack: error instanceof Error ? error.stack : undefined,
        env_check: {
          CDP_API_KEY_NAME: process.env.CDP_API_KEY_NAME ? 'Set' : 'Missing',
          CDP_API_KEY_SECRET: process.env.CDP_API_KEY_SECRET ? 'Set' : 'Missing',
        }
      } : {}
    }, { status: 500 });
  }
}
