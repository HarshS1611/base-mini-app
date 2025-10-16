'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAccount, useBalance } from 'wagmi';
import { ArrowDownToLine, Loader2, CheckCircle, ExternalLink, AlertCircle, Shield } from 'lucide-react';
import { CONTRACTS } from '@/lib/utils';

export default function OnrampFlow() {
  const [amount, setAmount] = useState('50');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const { address, isConnected } = useAccount();
  const { data: usdcBalance, refetch: refetchBalance } = useBalance({
    address,
    token: CONTRACTS.USDC,
  });

  const handleOnramp = async () => {
    if (!isConnected || !amount || !address) return;

    setIsLoading(true);
    setResult(null);
    setError('');

    try {
      // Validate amount
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount < 10) {
        throw new Error('Minimum deposit amount is $10');
      }
      if (numericAmount > 1000) {
        throw new Error('Maximum deposit amount is $1,000');
      }

      console.log('🔄 Initiating onramp for:', { amount, address });

      const response = await fetch('/api/onramp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount.toString(),
          userAddress: address,
          paymentMethod: 'ACH_BANK_ACCOUNT'
        })
      });

      const data = await response.json();
      console.log('📥 Onramp API response:', data);

      if (data.success) {
        // Open Coinbase onramp in new window with better window settings
        const onrampWindow = window.open(
          data.onrampUrl, 
          'coinbase-onramp',
          'width=500,height=700,scrollbars=yes,resizable=yes,status=yes,location=yes'
        );

        if (!onrampWindow) {
          throw new Error('Popup blocked. Please allow popups and try again.');
        }
        
        setResult({
          success: true,
          message: `Onramp initiated for ${data.amount} USDC`,
          onrampUrl: data.onrampUrl,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          sessionToken: data.sessionToken,
          redirectUrl: data.redirectUrl
        });

        // Monitor window close and refresh balance
        const checkClosed = setInterval(() => {
          if (onrampWindow.closed) {
            clearInterval(checkClosed);
            console.log('🔄 Onramp window closed, refreshing balance...');
            setTimeout(() => {
              refetchBalance();
            }, 2000);
          }
        }, 1000);

        // Auto-refresh balance after 30 seconds
        setTimeout(() => {
          refetchBalance();
        }, 30000);
      } else {
        throw new Error(data.error || 'Onramp initialization failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Onramp failed';
      console.error('❌ Onramp error:', error);
      setError(errorMessage);
      setResult({
        success: false,
        error: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentBalance = parseFloat(usdcBalance?.formatted || '0');
  const numericAmount = parseFloat(amount || '0');

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <ArrowDownToLine className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold">Deposit USDC (Onramp)</h3>
        <Badge variant="outline">USD → USDC</Badge>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <Shield className="w-3 h-3 mr-1" />
          Secure
        </Badge>
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
              onChange={(e) => setAmount(e.target.value)}
              className="pl-8"
              disabled={isLoading}
              min="10"
              max="1000"
              step="1"
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Will receive ~{amount} USDC on Base Sepolia
            </span>
            <span className="text-gray-400">
              Min: $10 • Max: $1,000
            </span>
          </div>
          
          {/* Amount validation */}
          {numericAmount > 0 && numericAmount < 10 && (
            <p className="text-xs text-red-600">Minimum deposit is $10</p>
          )}
          {numericAmount > 1000 && (
            <p className="text-xs text-red-600">Maximum deposit is $1,000</p>
          )}
        </div>

        {/* Payment Method Info */}
        <div className="p-3 bg-gray-50 rounded border">
          <p className="text-sm font-medium">Payment Method</p>
          <p className="text-xs text-gray-600">ACH Bank Transfer (US Bank Account)</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
            <span>✓ Free transfer</span>
            <span>✓ 1-3 business days</span>
            <span>✓ Up to $25,000/day</span>
          </div>
        </div>

        {/* Connection Warning */}
        {!isConnected && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to deposit USDC.
            </AlertDescription>
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Onramp Button */}
        <Button 
          onClick={handleOnramp}
          disabled={
            !isConnected || 
            !amount || 
            isLoading || 
            numericAmount < 10 || 
            numericAmount > 1000
          }
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating secure session...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <ArrowDownToLine className="w-4 h-4" />
              <span>Deposit ${amount} via Bank Transfer</span>
            </div>
          )}
        </Button>

        {/* Result */}
        {result && (
          <Card className={`p-4 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-start space-x-3">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.success ? 'Secure Onramp Window Opened!' : 'Onramp Failed'}
                </p>
                <p className={`text-sm mt-1 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                  {result.success 
                    ? `Complete your ${result.amount} USDC purchase in the secure Coinbase window. Funds will appear in your wallet once confirmed.`
                    : result.error
                  }
                </p>
                
                {result.success && (
                  <div className="mt-2 space-y-1 text-xs text-green-600">
                    {result.sessionToken && (
                      <div className="flex items-center space-x-1">
                        <Shield className="w-3 h-3" />
                        <span>Secure session token generated</span>
                      </div>
                    )}
                    <div>Redirect URL: {result.redirectUrl}</div>
                  </div>
                )}

                {result.success && result.onrampUrl && (
                  <a 
                    href={result.onrampUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 underline mt-2"
                  >
                    <span>Reopen Coinbase Window</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Info */}
        <div className="p-3 bg-blue-50 rounded border">
          <p className="text-xs text-blue-700">
            🏦 <strong>Secure & Private:</strong> Powered by Coinbase with session token security. Your bank details are encrypted and never stored by FlowSend.
          </p>
        </div>

        {/* Additional Info for Testnet */}
        <div className="p-3 bg-yellow-50 rounded border">
          <p className="text-xs text-yellow-700">
            ⚠️ <strong>Base Sepolia Testnet:</strong> This is a test environment. Real money will not be charged, but you may need to complete KYC for testing purposes.
          </p>
        </div>
      </div>
    </Card>
  );
}
