'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAccount, useBalance } from 'wagmi';
import { ArrowDownToLine, Loader2, Copy, CheckCircle, AlertCircle, QrCode } from 'lucide-react';
import { USDC_CONTRACT_ADDRESS } from '@/lib/constants';

export default function CircleDeposit() {
  const [depositAddress, setDepositAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const { address, isConnected } = useAccount();
  const { data: usdcBalance } = useBalance({
    address,
    token: USDC_CONTRACT_ADDRESS,
  });

  useEffect(() => {
    if (!isConnected) return;

    const loadDepositAddress = async () => {
      try {
        setIsLoading(true);
        
        // Try to get existing addresses
        const response = await fetch('/api/circle/deposit');
        const data = await response.json();

        if (data.success && data.addresses && data.addresses.length > 0) {
          // Use first USDC address
          const usdcAddr = data.addresses.find((a: any) => a.currency === 'USD');
          if (usdcAddr) {
            setDepositAddress(usdcAddr.address);
            return;
          }
        }

        // Create new deposit address
        const createResponse = await fetch('/api/circle/deposit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currency: 'USD',
            chain: 'ETH',
          }),
        });

        const createData = await createResponse.json();
        if (createData.success && createData.address) {
          setDepositAddress(createData.address.address);
        }
      } catch (err) {
        console.error('Failed to load deposit address:', err);
        setError('Failed to load deposit address. Please check Circle API configuration.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDepositAddress();
  }, [isConnected]);

  const copyAddress = () => {
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentBalance = parseFloat(usdcBalance?.formatted || '0');

  if (!isConnected) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <ArrowDownToLine className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Deposit USDC</h3>
          <Badge variant="outline">Receive USDC</Badge>
        </div>
        
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              Please connect your wallet to deposit funds.
            </p>
          </div>
        </Card>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <ArrowDownToLine className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold">Deposit USDC</h3>
        <Badge variant="outline">Receive USDC</Badge>
      </div>

      <div className="space-y-4">
        {/* Current Balance */}
        <div className="p-3 bg-blue-50 rounded border">
          <p className="text-sm text-gray-600">Current USDC Balance</p>
          <p className="text-xl font-bold text-blue-600">
            {currentBalance.toFixed(2)} USDC
          </p>
        </div>

        {error && (
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Configuration Error</p>
                <p className="text-xs text-red-700 mt-1">{error}</p>
                <div className="mt-2">
                  <a 
                    href="/api/circle/test" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-red-600 underline"
                  >
                    Test Circle API Connection
                  </a>
                </div>
              </div>
            </div>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading deposit address...</span>
          </div>
        ) : depositAddress ? (
          <>
            {/* Deposit Address */}
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-800">Your Deposit Address</p>
              </div>
              <p className="text-xs text-green-700 mb-3">
                Send USDC (ERC-20) to this address on Ethereum network
              </p>
              
              <div className="bg-white p-3 rounded border flex items-center justify-between">
                <code className="text-xs font-mono text-gray-800 break-all flex-1">
                  {depositAddress}
                </code>
                <Button
                  onClick={copyAddress}
                  variant="ghost"
                  size="sm"
                  className="ml-2"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </Card>

            {/* Instructions */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <p className="text-sm font-medium text-blue-800 mb-2">How to Deposit:</p>
              <ol className="text-xs text-blue-700 space-y-1">
                <li>1. Copy the deposit address above</li>
                <li>2. Send USDC (ERC-20) from any wallet or exchange</li>
                <li>3. Funds will appear in your balance after confirmation</li>
                <li>4. Minimum: 1 USDC</li>
              </ol>
            </Card>

            {/* Get Testnet USDC */}
            <Card className="p-4 bg-yellow-50 border-yellow-200">
              <p className="text-sm font-medium text-yellow-800 mb-2">
                🧪 Get Testnet USDC
              </p>
              <p className="text-xs text-yellow-700 mb-2">
                For testing, get free testnet USDC:
              </p>
              <a
                href="https://faucet.circle.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-yellow-800 underline inline-flex items-center"
              >
                Circle Testnet Faucet
                <ArrowDownToLine className="w-3 h-3 ml-1" />
              </a>
            </Card>
          </>
        ) : (
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <p className="text-sm text-yellow-800">
              Unable to generate deposit address. Please check your Circle API configuration.
            </p>
          </Card>
        )}

        {/* Info */}
        <div className="p-3 bg-blue-50 rounded border">
          <p className="text-xs text-blue-700">
            🏦 <strong>Powered by Circle:</strong> Receive USDC directly to your Circle-managed address. Funds are automatically credited to your balance.
          </p>
        </div>
      </div>
    </Card>
  );
}
