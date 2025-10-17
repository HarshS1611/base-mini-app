import { NextRequest, NextResponse } from 'next/server';
import { circleClient } from '@/lib/circle/client';

/**
 * POST: Create a payout (withdraw to bank)
 * Following: https://developers.circle.com/circle-mint/quickstart-withdraw-to-bank
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, bankAccountId, beneficiaryEmail } = body;

    if (!amount || !bankAccountId) {
      return NextResponse.json(
        { success: false, error: 'Amount and bank account ID are required' },
        { status: 400 }
      );
    }

    console.log('🏦 Creating payout (withdrawal):', { amount, bankAccountId });

    // Create payout
    const payout = await circleClient.createPayout({
      amount: {
        amount: amount.toString(),
        currency: 'USD',
      },
      destination: {
        type: 'wire',
        id: bankAccountId,
      },
      metadata: beneficiaryEmail ? {
        beneficiaryEmail,
      } : undefined,
    });

    console.log('✅ Payout created:', payout);

    return NextResponse.json({
      success: true,
      payout: payout.data,
      message: `Withdrawal of $${amount} initiated`,
    });
  } catch (error) {
    console.error('❌ Circle withdrawal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Withdrawal failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Get payout status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const payoutId = searchParams.get('payoutId');

    if (!payoutId) {
      return NextResponse.json(
        { success: false, error: 'Payout ID required' },
        { status: 400 }
      );
    }

    const payout = await circleClient.getPayout(payoutId);

    return NextResponse.json({
      success: true,
      payout: payout.data,
    });
  } catch (error) {
    console.error('❌ Get payout error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get payout',
      },
      { status: 500 }
    );
  }
}
