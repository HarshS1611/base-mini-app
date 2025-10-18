'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAccount, useBalance } from 'wagmi';
import { ArrowDownToLine, Loader2, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react';
import { USDC_CONTRACT_ADDRESS } from '@/lib/constants';
import {
  setupOnrampEventListeners,
  getOnrampBuyUrl
} from '@coinbase/onchainkit/fund';
import type { SuccessEventData, OnrampError } from '@coinbase/onchainkit/fund';
import { generateOnrampURL } from '@/lib/onRamp';
import { FundCard,fetchOnrampConfig } from '@coinbase/onchainkit/fund';


export default function OnrampFlow() {
  const [amount, setAmount] = useState('50');
  const [onrampUrl, setOnrampUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);
  const [sessionToken, setSessionToken] = useState<string | undefined>();

  const { address, isConnected } = useAccount();

  const { data: usdcBalance, refetch: refetchBalance } = useBalance({
    address,
    token: USDC_CONTRACT_ADDRESS,
  });

  // Generate session token and onramp URL when address is available
  useEffect(() => {
    if (!address) return;

    const generateSessionToken = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🔄 Generating session token for address:', address);

        // Generate session token via API
        const response = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            addresses: [
              {
                address: address,
                blockchains: ['base'],
              },
            ],
            assets: ['USDC'],
          }),
        });

        const data = await response.json();

        setSessionToken(data.token || null);

        if (!response.ok || !data) {
          console.error('❌ Session token generation failed:', data);
          throw new Error(data.error || 'Failed to generate session token');
        }

        const { token } = data;

        if (!token) {
          throw new Error('No token received from API');
        }

        console.log('✅ Session token generated successfully');

        // Generate onramp URL using OnchainKit
        const url = generateOnrampURL({
          sessionToken: token,
          presetFiatAmount: parseFloat(amount) || 50,
          fiatCurrency: 'USD',
          // Optional parameters
          defaultNetwork: 'base',
          defaultAsset: 'USDC',
        });

        setOnrampUrl(url);
        console.log('✅ Onramp URL generated');
      } catch (err) {
        console.error('❌ Onramp setup error:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to setup onramp'
        );
      } finally {
        setIsLoading(false);
      }
    };

    generateSessionToken();
  }, [address, amount]);

  // Setup event listeners for onramp events
  useEffect(() => {
    if (!onrampUrl) return;

    console.log('👂 Setting up onramp event listeners');

    const unsubscribe = setupOnrampEventListeners({
      onSuccess: (data?: SuccessEventData) => {
        console.log('✅ Onramp purchase successful:', data);
        setIsComplete(true);

        // Close popup window
        if (popupWindow && !popupWindow.closed) {
          popupWindow.close();
        }

        // Refetch balance after successful purchase
        setTimeout(() => {
          refetchBalance();
        }, 3000);
      },
      onExit: (err?: OnrampError) => {
        console.log('🚪 Onramp exited:', err);

        if (err) {
          setError('Transaction was cancelled or failed');
        }

        // Close popup window
        if (popupWindow && !popupWindow.closed) {
          popupWindow.close();
        }
      },
    });

    return () => {
      console.log('🧹 Cleaning up onramp event listeners');
      unsubscribe();
    };
  }, [onrampUrl, popupWindow, refetchBalance]);

  const openOnrampPopup = () => {
    if (!onrampUrl) return;

    console.log('🪟 Opening onramp popup');

    const popup = window.open(
      onrampUrl,
      'coinbase-onramp',
      'width=500,height=700,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
    );

    if (popup) {
      setPopupWindow(popup);
    } else {
      setError('Popup blocked. Please allow popups for this site.');
    }
  };

  const currentBalance = parseFloat(usdcBalance?.formatted || '0');

  // Not connected state
  if (!isConnected) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <ArrowDownToLine className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Deposit USDC (Onramp)</h3>
          <Badge variant="outline">USD → USDC</Badge>
        </div>

        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              Please connect your wallet to deposit USDC.
            </p>
          </div>
        </Card>
      </Card>
    );
  }

  // Complete state
  if (isComplete) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <ArrowDownToLine className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Deposit USDC (Onramp)</h3>
          <Badge variant="outline">USD → USDC</Badge>
        </div>

        <Card className="p-6 bg-green-50 border-green-200 text-center">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
          <p className="text-lg font-semibold text-green-800 mb-2">
            Purchase Complete! 🎉
          </p>
          <p className="text-sm text-green-700 mb-4">
            Your transaction has been processed successfully. USDC should appear in your wallet shortly.
          </p>
          <Button
            onClick={() => {
              setIsComplete(false);
              setOnrampUrl(null);
            }}
            className="w-full"
          >
            Buy More USDC
          </Button>
        </Card>

        {/* Current Balance */}
        <div className="mt-4 p-3 bg-blue-50 rounded border">
          <p className="text-sm text-gray-600">Current USDC Balance</p>
          <p className="text-xl font-bold text-blue-600">
            {currentBalance.toFixed(2)} USDC
          </p>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <ArrowDownToLine className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Deposit USDC (Onramp)</h3>
          <Badge variant="outline">USD → USDC</Badge>
        </div>

        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-xs text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </Card>

        <Button
          onClick={() => {
            setError(null);
            setOnrampUrl(null);
            window.location.reload();
          }}
          className="w-full mt-4"
          variant="destructive"
        >
          Retry
        </Button>
      </Card>
    );
  }

  // Main onramp UI
  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <ArrowDownToLine className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold">Deposit USDC (Onramp)</h3>
        <Badge variant="outline">USD → USDC</Badge>
      </div>

      <div className="space-y-4">
        {/* Current Balance */}
        <div className="p-3 bg-blue-50 rounded border">
          <p className="text-sm text-gray-600">Current USDC Balance</p>
          <p className="text-xl font-bold text-blue-600">
            {currentBalance.toFixed(2)} USDC
          </p>
          <p className="text-xs text-gray-500 mt-1">on Base Sepolia</p>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Deposit Amount (USD)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <Input
              type="number"
              placeholder="50"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setOnrampUrl(null); // Reset URL when amount changes
              }}
              className="pl-8"
              disabled={isLoading}
              min="10"
              max="1000"
            />
          </div>
          <p className="text-xs text-gray-500">
            Will receive ~{amount} USDC on Base Sepolia
          </p>
        </div>

        {/* Payment Method Info */}
        <div className="p-3 bg-gray-50 rounded border">
          <p className="text-sm font-medium">Payment Method</p>
          <p className="text-xs text-gray-600">Coinbase Onramp - Multiple options available</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
            <span>✓ Bank Transfer</span>
            <span>✓ Debit Card</span>
            <span>✓ Apple Pay</span>
          </div>
        </div>

        {/* Onramp Button */}
        <Button
          onClick={openOnrampPopup}
          disabled={isLoading || !onrampUrl || !isConnected}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Secure Session...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <ArrowDownToLine className="w-4 h-4" />
              <span>Buy ${amount} USDC</span>
            </div>
          )}

        </Button>

        <FundCard
          sessionToken={sessionToken}
          assetSymbol="ETH"
          country="US"
          currency="USD"
        />;

        {/* Info */}
        <div className="p-3 bg-blue-50 rounded border">
          <p className="text-xs text-blue-700">
            🏦 <strong>Secure & Fast:</strong> Powered by Coinbase Onramp with OnchainKit. Session tokens ensure your transaction is secure.
          </p>
        </div>

        {/* Testnet Notice */}
        <div className="p-3 bg-yellow-50 rounded border">
          <p className="text-xs text-yellow-700">
            🧪 <strong>Base Sepolia Testnet:</strong> This is a test environment. You may need to complete KYC for testing purposes.
          </p>
        </div>
      </div>
    </Card>
  );
}
