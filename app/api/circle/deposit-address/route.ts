import { NextRequest, NextResponse } from 'next/server';
import { getCircleClient } from '@/lib/circle/client';

/**
 * POST: Create a blockchain deposit address
 * Body:
 * {
 *   "currency": "USD",
 *   "chain": "BASE"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currency, chain } = body;

    if (!currency || !chain) {
      return NextResponse.json({ success: false, error: 'Currency and chain required' }, { status: 400 });
    }

    const client = getCircleClient();
    const depositAddress = await client.createBlockchainAddress({ currency, chain });

    return NextResponse.json({
      success: true,
      address: depositAddress.data,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create deposit address',
    }, { status: 500 });
  }
}

/**
 * GET: List all blockchain deposit addresses
 */
export async function GET() {
  try {
    const client = getCircleClient();
    const addresses = await client.getBlockchainAddresses();

    return NextResponse.json({
      success: true,
      addresses: addresses.data || [],
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get deposit addresses',
      addresses: [],
    }, { status: 500 });
  }
}
