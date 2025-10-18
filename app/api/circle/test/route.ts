import { NextResponse } from 'next/server';
import { getCircleClient } from '@/lib/circle/client';

export async function GET() {
  try {
    if (!process.env.CIRCLE_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'CIRCLE_API_KEY not configured',
      }, { status: 500 });
    }

    const client = getCircleClient();
    const config = await client.getConfiguration();

    return NextResponse.json({
      success: true,
      message: 'Circle API connection successful',
      config: config.data,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Connection test failed',
    }, { status: 500 });
  }
}
