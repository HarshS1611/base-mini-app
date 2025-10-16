'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAccount, useBalance } from 'wagmi';
import { ArrowUpFromLine, Loader2, CheckCircle, ExternalLink, AlertCircle, Shield } from 'lucide-react';
import { CONTRACTS } from '@/lib/utils';

export default function OfframpFlow() {
  const [amount, setAmount] = useState('25');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const { address, isConnected } = useAccount();
  const { data: usdcBalance, refetch: refetchBalance } = useBalance({
    address,
    token: CONTRACTS.USDC,
  });

  const handleOfframp = async () => {
    if (!isConnected || !amount || !address) return;

    setIsLoading(true);
    setResult(null);
    setError('');

    try {
      // Validate amount
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount < 10) {
        throw new Error('Minimum withdrawal amount is $10');
      }

      const currentBalance = parseFloat(usdcBalance?.formatted || '0');
      if (numericAmount > currentBalance) {
        throw new Error(`Insufficient balance. You have ${currentBalance.toFixed(2)} USDC available.`);
      }

      console.log('🔄 Initiating offramp for:', { amount, address });

      const response = await fetch('/api/offramp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount.toString(),
          userAddress: address,
          cashoutMethod: 'ACH_BANK_ACCOUNT'
        })
      });

      const data = await response.json();
      console.log('📤 Offramp API response:', data);

      if (data.success) {
        // Open Coinbase offramp in new window with better window settings
        const offrampWindow = window.open(
          data.offrampUrl, 
          'coinbase-offramp',
          'width=500,height=700,scrollbars=yes,resizable=yes,status=yes,location=yes'
        );

        if (!offrampWindow) {
          throw new Error('Popup blocked. Please allow popups and try again.');
        }
        
        setResult({
          success: true,
          message: `Offramp initiated for ${data.amount} USDC`,
          offrampUrl: data.offrampUrl,
          amount: data.amount,
          cashoutMethod: data.cashoutMethod,
          sessionToken: data.sessionToken,
          redirectUrl: data.redirectUrl
        });

        // Monitor window close and refresh balance
        const checkClosed = setInterval(() => {
          if (offrampWindow.closed) {
            clearInterval(checkClosed);
            console.log('🔄 Offramp window closed, refreshing balance...');
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
        throw new Error(data.error || 'Offramp initialization failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Offramp failed';
      console.error('❌ Offramp error:', error);
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
  const requestedAmount = parseFloat(amount || '0');

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <ArrowUpFromLine className="w-5 h-5 text-green-500" />
        <h3 className="text-lg font-semibold">Withdraw to Bank (Offramp)</h3>
        <Badge variant="outline">USDC → USD</Badge>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <Shield className="w-3 h-3 mr-1" />
          Secure
        </Badge>
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
          <div className="relative">
            <Input
              type="number"
              placeholder="25"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
              min="10"
              max={currentBalance.toString()}
              step="0.01"
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">
              Will receive ~${amount} USD in your bank account
            </span>
            <span className="text-gray-400">
              Available: {currentBalance.toFixed(2)} USDC
            </span>
          </div>

          {/* Amount validation */}
          {requestedAmount > 0 && requestedAmount < 10 && (
            <p className="text-xs text-red-600">Minimum withdrawal is $10</p>
          )}
          {requestedAmount > currentBalance && (
            <p className="text-xs text-red-600">
              Insufficient balance. You have {currentBalance.toFixed(2)} USDC available.
            </p>
          )}
          {currentBalance === 0 && (
            <p className="text-xs text-yellow-600">
              No USDC balance. Use the Deposit tab to add funds first.
            </p>
          )}
        </div>

        {/* Bank Account Info */}
        <div className="p-3 bg-gray-50 rounded border">
          <p className="text-sm font-medium">Withdrawal Method</p>
          <p className="text-xs text-gray-600">ACH Bank Transfer (US Bank Account)</p>
          <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
            <span>✓ Free transfer</span>
            <span>✓ 1-3 business days</span>
            <span>✓ Direct deposit</span>
          </div>
        </div>

        {/* Connection Warning */}
        {!isConnected && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to withdraw USDC.
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

        {/* Offramp Button */}
        <Button 
          onClick={handleOfframp}
          disabled={
            !isConnected || 
            !amount || 
            isLoading || 
            requestedAmount <= 0 || 
            requestedAmount > currentBalance ||
            requestedAmount < 10 ||
            currentBalance === 0
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
              <ArrowUpFromLine className="w-4 h-4" />
              <span>Withdraw ${amount} to Bank Account</span>
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
                  {result.success ? 'Secure Offramp Window Opened!' : 'Offramp Failed'}
                </p>
                <p className={`text-sm mt-1 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                  {result.success 
                    ? `Complete your ${result.amount} USDC withdrawal in the secure Coinbase window. Funds will be deposited to your bank account in 1-3 business days.`
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
                    <div>Expected processing: 1-3 business days</div>
                  </div>
                )}

                {result.success && result.offrampUrl && (
                  <a 
                    href={result.offrampUrl}
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
        <div className="p-3 bg-green-50 rounded border">
          <p className="text-xs text-green-700">
            💰 <strong>Direct & Secure:</strong> Funds are deposited directly to your linked bank account with session token security. You'll receive confirmation when the transfer completes.
          </p>
        </div>

        {/* Additional Info for Testnet */}
        <div className="p-3 bg-yellow-50 rounded border">
          <p className="text-xs text-yellow-700">
            ⚠️ <strong>Base Sepolia Testnet:</strong> This is a test environment. No real money will be transferred, but you may need to complete KYC for testing purposes.
          </p>
        </div>
      </div>
    </Card>
  );
}
