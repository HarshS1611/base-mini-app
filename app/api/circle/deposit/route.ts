import { NextRequest, NextResponse } from 'next/server';
import { getCircleClient } from '@/lib/circle/client';

/**
 * GET: Get deposit addresses
 */
export async function GET() {
  try {
    const client = getCircleClient();
    const addresses = await client.getDepositAddresses();

    return NextResponse.json({
      success: true,
      addresses: addresses.data || [],
    });
  } catch (error) {
    console.error('❌ Get deposit addresses error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get addresses',
      addresses: [],
    });
  }
}

/**
 * POST: Create new deposit address
 */
export async function POST(request: NextRequest) {
  try {
    const { currency = 'USD', chain = 'ETH' } = await request.json();

    const client = getCircleClient();
    const address = await client.createDepositAddress({
      currency,
      chain,
    });

    return NextResponse.json({
      success: true,
      address: address.data,
    });
  } catch (error) {
    console.error('❌ Create deposit address error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create address',
    }, { status: 500 });
  }
}
