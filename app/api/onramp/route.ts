import { NextRequest, NextResponse } from 'next/server';
import { generateOnrampURL, generateOnrampSessionToken } from '@/lib/onRamp';

export async function POST(request: NextRequest) {
  try {
    const { 
      amount, 
      userAddress, 
      paymentMethod = 'ACH_BANK_ACCOUNT'
    } = await request.json();

    if (!amount || !userAddress) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: amount and userAddress'
      }, { status: 400 });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount < 10) {
      return NextResponse.json({
        success: false,
        error: 'Invalid amount. Minimum $10 required.'
      }, { status: 400 });
    }

    console.log('🔄 Processing onramp request:', { amount, userAddress, paymentMethod });

    // Try to generate session token (with fallback to non-session mode)
    let sessionToken = '';
    let sessionMode = 'fallback';
    
    try {
      sessionToken = await generateOnrampSessionToken(userAddress);
      if (sessionToken) {
        sessionMode = 'secure';
        console.log('✅ Using secure session token mode');
      } else {
        console.log('⚠️ Using fallback mode (no session token)');
      }
    } catch (sessionError) {
      console.warn('⚠️ Session token generation failed, using fallback:', sessionError);
    }

    // Generate onramp URL (will handle both session and non-session modes)
    const onrampUrl = generateOnrampURL({
      asset: 'USDC',
      amount: amount.toString(),
      network: 'base',
      paymentMethod,
      address: userAddress,
      sessionToken: sessionToken || undefined, // Pass undefined if empty string
      redirectUrl: process.env.NEXT_PUBLIC_ONRAMP_REDIRECT_URL
    });

    console.log('✅ Onramp URL generated successfully in', sessionMode, 'mode');

    return NextResponse.json({
      success: true,
      onrampUrl,
      amount: numericAmount,
      asset: 'USDC',
      network: 'base',
      paymentMethod,
      sessionToken: !!sessionToken, // Boolean indicator
      sessionMode, // 'secure' or 'fallback'
      redirectUrl: process.env.NEXT_PUBLIC_ONRAMP_REDIRECT_URL,
      message: `Onramp URL generated for ${amount} USDC (${sessionMode} mode)`,
      expiresIn: sessionToken ? 300 : null // 5 minutes for session tokens
    });

  } catch (error) {
    console.error('❌ Onramp API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Onramp initialization failed',
      details: process.env.NODE_ENV === 'development' ? {
        stack: error instanceof Error ? error.stack : undefined
      } : undefined
    }, { status: 500 });
  }
}
