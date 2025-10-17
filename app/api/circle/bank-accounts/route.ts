import { NextRequest, NextResponse } from 'next/server';
import { getCircleClient } from '@/lib/circle/client';

/**
 * GET: Get list of bank accounts
 */
export async function GET() {
  try {
    // Check if Circle is configured
    if (!process.env.CIRCLE_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Circle API not configured',
        bankAccounts: [],
      });
    }

    const client = getCircleClient();
    const response = await client.getWireBankAccounts();
    console.log('✅ Retrieved bank accounts',response);

    return NextResponse.json({
      success: true,
      bankAccounts: response.data || [],
    });
  } catch (error) {
    console.error('❌ Get bank accounts error:', error);
    
    // Return graceful error for UI
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get bank accounts',
      bankAccounts: [],
      needsConfiguration: error instanceof Error && error.message.includes('credentials'),
    });
  }
}

/**
 * POST: Create a new bank account
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.CIRCLE_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Circle API not configured',
      }, { status: 500 });
    }

    const body = await request.json();
    const {
      accountNumber,
      routingNumber,
      accountHolderName,
      address,
      bankName,
    } = body;

    if (!accountNumber || !routingNumber || !accountHolderName || !address) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log('🏦 Creating wire bank account');

    const client = getCircleClient();
    const response = await client.createWireBankAccount({
      accountNumber,
      routingNumber,
      billingDetails: {
        name: accountHolderName,
        line1: address.line1,
        city: address.city,
        district: address.state || address.district,
        postalCode: address.postalCode,
        country: address.country || 'US',
      },
      bankAddress: {
        bankName: bankName || 'Bank',
        city: address.city,
        country: address.country || 'US',
        line1: address.line1,
        district: address.state || address.district,
      },
    });

    console.log('✅ Bank account created');

    return NextResponse.json({
      success: true,
      bankAccount: response.data,
    });
  } catch (error) {
    console.error('❌ Create bank account error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create bank account',
    }, { status: 500 });
  }
}
