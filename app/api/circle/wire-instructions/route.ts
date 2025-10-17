import { NextRequest, NextResponse } from 'next/server';
import { circleClient } from '@/lib/circle/client';

/**
 * GET: Get wire instructions for a bank account
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bankAccountId = searchParams.get('bankAccountId');
    const currency = searchParams.get('currency') || 'USD';

    if (!bankAccountId) {
      return NextResponse.json(
        { success: false, error: 'Bank account ID required' },
        { status: 400 }
      );
    }

    const instructions = await circleClient.getWireInstructions(bankAccountId, currency);

    return NextResponse.json({
      success: true,
      instructions: instructions.data,
    });
  } catch (error) {
    console.error('❌ Get wire instructions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get wire instructions',
      },
      { status: 500 }
    );
  }
}
