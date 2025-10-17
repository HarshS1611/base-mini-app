'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAccount, useBalance } from 'wagmi';
import { ArrowUpFromLine, Loader2, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react';
import { USDC_CONTRACT_ADDRESS } from '@/lib/constants';

export default function OfframpFlow() {
  const [amount, setAmount] = useState('25');
  const [offrampUrl, setOfframpUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [popupWindow, setPopupWindow] = useState<Window | null>(null);

  const { address, isConnected } = useAccount();
  
  const { data: usdcBalance, refetch: refetchBalance } = useBalance({
    address,
    token: USDC_CONTRACT_ADDRESS,
  });

  // Generate session token and offramp URL when address is available
  useEffect(() => {
    if (!address) return;

    const generateOfframpUrl = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🔄 Generating offramp session for address:', address);

        // Call offramp API
        const response = await fetch('/api/offramp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            userAddress: address,
            cashoutMethod: 'ACH_BANK_ACCOUNT',
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to generate offramp URL');
        }

        setOfframpUrl(data.offrampUrl);
        console.log('✅ Offramp URL generated');
      } catch (err) {
        console.error('❌ Offramp setup error:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to setup offramp'
        );
      } finally {
        setIsLoading(false);
      }
    };

    generateOfframpUrl();
  }, [address, amount]);

  const openOfframpPopup = () => {
    if (!offrampUrl) return;

    console.log('🪟 Opening offramp popup');

    const popup = window.open(
      offrampUrl,
      'coinbase-offramp',
      'width=500,height=700,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
    );

    if (popup) {
      setPopupWindow(popup);
      
      // Monitor popup close
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          console.log('🚪 Offramp window closed');
          setIsComplete(true);
          setTimeout(() => refetchBalance(), 2000);
        }
      }, 1000);
    } else {
      setError('Popup blocked. Please allow popups for this site.');
    }
  };

  const currentBalance = parseFloat(usdcBalance?.formatted || '0');
  const requestedAmount = parseFloat(amount || '0');

  // Not connected state
  if (!isConnected) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <ArrowUpFromLine className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold">Withdraw to Bank (Offramp)</h3>
          <Badge variant="outline">USDC → USD</Badge>
        </div>
        
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              Please connect your wallet to withdraw USDC.
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
          <ArrowUpFromLine className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold">Withdraw to Bank (Offramp)</h3>
          <Badge variant="outline">USDC → USD</Badge>
        </div>

        <Card className="p-6 bg-green-50 border-green-200 text-center">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
          <p className="text-lg font-semibold text-green-800 mb-2">
            Withdrawal Initiated! 🎉
          </p>
          <p className="text-sm text-green-700 mb-4">
            Your withdrawal has been processed. Funds will arrive in your bank account in 1-3 business days.
          </p>
          <Button 
            onClick={() => {
              setIsComplete(false);
              setOfframpUrl(null);
            }}
            className="w-full"
          >
            Withdraw More
          </Button>
        </Card>

        {/* Current Balance */}
        <div className="mt-4 p-3 bg-green-50 rounded border">
          <p className="text-sm text-gray-600">Available USDC Balance</p>
          <p className="text-xl font-bold text-green-600">
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
          <ArrowUpFromLine className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold">Withdraw to Bank (Offramp)</h3>
          <Badge variant="outline">USDC → USD</Badge>
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
            setOfframpUrl(null);
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

  // Main offramp UI
  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <ArrowUpFromLine className="w-5 h-5 text-green-500" />
        <h3 className="text-lg font-semibold">Withdraw to Bank (Offramp)</h3>
        <Badge variant="outline">USDC → USD</Badge>
      </div>

      <div className="space-y-4">
        {/* Current Balance */}
        <div className="p-3 bg-green-50 rounded border">
          <p className="text-sm text-gray-600">Available USDC Balance</p>
          <p className="text-xl font-bold text-green-600">
            {currentBalance.toFixed(2)} USDC
          </p>
          <p className="text-xs text-gray-500 mt-1">on Base Sepolia</p>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Withdrawal Amount (USDC)</label>
          <Input
            type="number"
            placeholder="25"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setOfframpUrl(null); // Reset URL when amount changes
            }}
            disabled={isLoading}
            min="10"
            max={currentBalance.toString()}
            step="0.01"
          />
          <p className="text-xs text-gray-500">
            Will receive ~${amount} USD in your bank account
          </p>
          {requestedAmount > currentBalance && (
            <p className="text-xs text-red-600">
              Insufficient balance. You have {currentBalance.toFixed(2)} USDC available.
            </p>
          )}
        </div>

        {/* Withdrawal Method Info */}
        <div className="p-3 bg-gray-50 rounded border">
          <p className="text-sm font-medium">Withdrawal Method</p>
          <p className="text-xs text-gray-600">ACH Bank Transfer (US Bank Account)</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
            <span>✓ Free transfer</span>
            <span>✓ 1-3 business days</span>
            <span>✓ Direct deposit</span>
          </div>
        </div>

        {/* Offramp Button */}
        <Button 
          onClick={openOfframpPopup}
          disabled={
            isLoading || 
            !offrampUrl || 
            !isConnected || 
            requestedAmount <= 0 || 
            requestedAmount > currentBalance
          }
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
              <ArrowUpFromLine className="w-4 h-4" />
              <span>Withdraw ${amount} to Bank</span>
            </div>
          )}
        </Button>

        {/* Info */}
        <div className="p-3 bg-green-50 rounded border">
          <p className="text-xs text-green-700">
            💰 <strong>Direct Deposit:</strong> Funds deposited directly to your linked bank account with session token security.
          </p>
        </div>

        {/* Testnet Notice */}
        <div className="p-3 bg-yellow-50 rounded border">
          <p className="text-xs text-yellow-700">
            🧪 <strong>Base Sepolia Testnet:</strong> This is a test environment. No real money will be transferred.
          </p>
        </div>
      </div>
    </Card>
  );
}
