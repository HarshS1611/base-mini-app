import { NextRequest, NextResponse } from 'next/server';
import { getCircleClient } from '@/lib/circle/client';

export async function GET(request: NextRequest) {
  try {
    if (!process.env.CIRCLE_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'CIRCLE_API_KEY not configured',
      }, { status: 500 });
    }

    console.log('🧪 Testing Circle API connection...');

    const client = getCircleClient();

    // Test with configuration endpoint (works with sandbox)
    const config = await client.getConfiguration();

    console.log('✅ Circle API test successful',config);

    return NextResponse.json({
      success: true,
      message: 'Circle API connection successful',
      config: config.data,
    });
  } catch (error) {
    console.error('❌ Circle API test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
      instructions: [
        '1. Get API key from https://app-sandbox.circle.com',
        '2. Add to .env.local: CIRCLE_API_KEY=TEST_API_KEY:...',
        '3. Restart dev server',
      ],
    }, { status: 500 });
  }
}
