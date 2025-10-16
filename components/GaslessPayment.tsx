'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  useAccount, 
  useBalance, 
  useSendTransaction,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { parseUnits, encodeFunctionData } from 'viem';
import { Send, Loader2, CheckCircle, AlertCircle, Zap, ExternalLink, Shield } from 'lucide-react';
import { CONTRACTS, DEMO_ADDRESSES, formatAddress } from '@/lib/utils';
import { paymasterService } from '@/lib/paymaster';

// ERC20 ABI
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const;

export default function GaslessPayment() {
  const [amount, setAmount] = useState('1');
  const [recipient, setRecipient] = useState(DEMO_ADDRESSES.recipient1);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [sponsorshipStatus, setSponsorshipStatus] = useState<{
    checking: boolean;
    eligible: boolean;
    reason?: string;
  }>({ checking: false, eligible: false });
  
  const { address, isConnected } = useAccount();
  
  const { data: usdcBalance, refetch: refetchBalance } = useBalance({
    address,
    token: CONTRACTS.USDC,
  });

  const { data: ethBalance } = useBalance({
    address,
  });

  const { sendTransaction, data: hash, error, isPending } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Check paymaster sponsorship eligibility
  const checkSponsorship = async () => {
    if (!address || !amount || !recipient) {
      setSponsorshipStatus({ checking: false, eligible: false });
      return;
    }

    setSponsorshipStatus({ checking: true, eligible: false });

    try {
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        setSponsorshipStatus({
          checking: false,
          eligible: false,
          reason: 'Invalid amount'
        });
        return;
      }

      const amountWei = parseUnits(amount, 6);
      const callData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [recipient as `0x${string}`, amountWei],
      });

      console.log('🔍 Checking sponsorship for transaction:', {
        from: address,
        to: CONTRACTS.USDC,
        amount: amountWei.toString(),
        callData
      });

      // Check eligibility using paymaster service
      const isEligible = await paymasterService.isEligibleForSponsorship(
        address,
        CONTRACTS.USDC,
        BigInt(0), // No ETH value for ERC20 transfer
        callData
      );

      if (isEligible) {
        // Double-check with API
        const paymasterData = await paymasterService.getPaymasterData(
          address,
          {
            to: CONTRACTS.USDC,
            value: BigInt(0),
            data: callData
          }
        );

        setSponsorshipStatus({
          checking: false,
          eligible: paymasterData !== null,
          reason: paymasterData ? 'Transaction will be sponsored by paymaster' : 'Paymaster declined sponsorship'
        });
      } else {
        setSponsorshipStatus({
          checking: false,
          eligible: false,
          reason: 'Transaction not eligible for sponsorship (check amount limits and contract allowlist)'
        });
      }
    } catch (error) {
      console.error('❌ Sponsorship check failed:', error);
      setSponsorshipStatus({
        checking: false,
        eligible: false,
        reason: `Sponsorship check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  // Check sponsorship when parameters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isConnected && address && amount && recipient) {
        checkSponsorship();
      }
    }, 500); // Debounce

    return () => clearTimeout(timeoutId);
  }, [isConnected, address, amount, recipient]);

  const handleSend = async () => {
    if (!isConnected || !amount || !recipient || !address) return;

    try {
      setStatus('pending');
      
      const amountWei = parseUnits(amount, 6);
      const callData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [recipient as `0x${string}`, amountWei],
      });

      console.log('🚀 Sending transaction:', {
        to: CONTRACTS.USDC,
        data: callData,
        sponsored: sponsorshipStatus.eligible
      });

      // Send transaction (paymaster will be handled automatically by smart wallet if eligible)
      sendTransaction({
        to: CONTRACTS.USDC,
        data: callData,
        value: BigInt(0),
      });

    } catch (err) {
      console.error('❌ Transaction failed:', err);
      setStatus('error');
    }
  };

  // Update status based on transaction state
  useEffect(() => {
    if (isConfirmed) {
      setStatus('success');
      refetchBalance();
      // Reset after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setAmount('');
        setDescription('');
        setSponsorshipStatus({ checking: false, eligible: false });
      }, 5000);
    } else if (error) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }, [isConfirmed, error, refetchBalance]);

  const isLoading = isPending || isConfirming;
  const currentBalance = parseFloat(usdcBalance?.formatted || '0');
  const ethBalanceNum = parseFloat(ethBalance?.formatted || '0');
  const requestedAmount = parseFloat(amount || '0');

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Zap className="w-5 h-5 text-green-500" />
        <h3 className="text-lg font-semibold">Gasless USDC Transfer</h3>
        {sponsorshipStatus.checking ? (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Checking...
          </Badge>
        ) : sponsorshipStatus.eligible ? (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Shield className="w-3 h-3 mr-1" />
            Gas Sponsored
          </Badge>
        ) : (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            Gas Required
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        {/* Balance Display */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 rounded border">
            <p className="text-sm text-gray-600">USDC Balance</p>
            <p className="text-xl font-bold text-blue-600">
              {currentBalance.toFixed(2)} USDC
            </p>
          </div>
          <div className="p-3 bg-gray-50 rounded border">
            <p className="text-sm text-gray-600">ETH for Gas</p>
            <p className="text-lg font-bold text-gray-600">
              {ethBalanceNum.toFixed(4)} ETH
            </p>
            {!sponsorshipStatus.eligible && ethBalanceNum < 0.001 && (
              <p className="text-xs text-red-600 mt-1">Low gas balance!</p>
            )}
          </div>
        </div>

        {/* Sponsorship Status */}
        {isConnected && address && amount && recipient && (
          <Card className={`p-3 ${
            sponsorshipStatus.checking ? 'bg-yellow-50 border-yellow-200' :
            sponsorshipStatus.eligible ? 'bg-green-50 border-green-200' : 
            'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex items-start space-x-2">
              {sponsorshipStatus.checking ? (
                <Loader2 className="w-4 h-4 text-yellow-600 animate-spin mt-0.5" />
              ) : sponsorshipStatus.eligible ? (
                <Shield className="w-4 h-4 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-medium ${
                  sponsorshipStatus.checking ? 'text-yellow-800' :
                  sponsorshipStatus.eligible ? 'text-green-800' : 
                  'text-orange-800'
                }`}>
                  {sponsorshipStatus.checking && 'Checking paymaster eligibility...'}
                  {!sponsorshipStatus.checking && sponsorshipStatus.eligible && '✅ Transaction will be gasless'}
                  {!sponsorshipStatus.checking && !sponsorshipStatus.eligible && '⚠️ Gas fees required'}
                </p>
                {sponsorshipStatus.reason && (
                  <p className={`text-xs mt-1 ${
                    sponsorshipStatus.eligible ? 'text-green-700' : 'text-orange-700'
                  }`}>
                    {sponsorshipStatus.reason}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Low ETH Warning */}
        {!sponsorshipStatus.eligible && ethBalanceNum < 0.001 && (
          <Card className="p-3 bg-red-50 border-red-200">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">Insufficient ETH for gas fees</p>
                <p className="text-xs text-red-700 mt-1">
                  Get Base Sepolia ETH from: 
                  <a 
                    href="https://faucet.quicknode.com/base/sepolia" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline ml-1"
                  >
                    Base Faucet
                  </a>
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Amount Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Amount (USDC)</label>
          <Input
            type="number"
            placeholder="10.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isLoading}
            min="0.01"
            max={currentBalance.toString()}
            step="0.01"
          />
          {requestedAmount > currentBalance && (
            <p className="text-xs text-red-600">
              Insufficient balance. You have {currentBalance.toFixed(2)} USDC available.
            </p>
          )}
          {requestedAmount > 1000 && (
            <p className="text-xs text-orange-600">
              Amounts over $1,000 may not be eligible for gas sponsorship.
            </p>
          )}
        </div>

        {/* Recipient Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Recipient</label>
          <Select value={recipient} onValueChange={setRecipient} disabled={isLoading}>
            <SelectTrigger>
              <SelectValue placeholder="Select recipient" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DEMO_ADDRESSES.recipient1}>
                Demo Address 1 ({formatAddress(DEMO_ADDRESSES.recipient1)})
              </SelectItem>
              <SelectItem value={DEMO_ADDRESSES.recipient2}>
                Demo Address 2 ({formatAddress(DEMO_ADDRESSES.recipient2)})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Description (Optional)</label>
          <Input
            placeholder="What's this for?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Send Button */}
        <Button 
          onClick={handleSend}
          disabled={
            !isConnected || 
            !amount || 
            !recipient || 
            isLoading || 
            requestedAmount <= 0 || 
            requestedAmount > currentBalance ||
            (!sponsorshipStatus.eligible && ethBalanceNum < 0.001) ||
            sponsorshipStatus.checking
          }
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>
                {isPending ? 'Confirming...' : 'Processing...'}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Send className="w-4 h-4" />
              {sponsorshipStatus.eligible && <Zap className="w-4 h-4" />}
              <span>
                Send {amount} USDC {sponsorshipStatus.eligible ? '(Gas Free)' : '(Gas Required)'}
              </span>
            </div>
          )}
        </Button>

        {/* Status Display */}
        {status !== 'idle' && (
          <Card className={`p-4 ${
            status === 'success' ? 'bg-green-50 border-green-200' :
            status === 'error' ? 'bg-red-50 border-red-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-start space-x-3">
              {status === 'success' && <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />}
              {status === 'error' && <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />}
              {status === 'pending' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin mt-0.5" />}
              
              <div className="flex-1">
                <p className={`font-medium ${
                  status === 'success' ? 'text-green-800' :
                  status === 'error' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {status === 'success' && (sponsorshipStatus.eligible ? 'Gasless Transaction Successful! ⚡' : 'Transaction Successful!')}
                  {status === 'error' && 'Transaction Failed'}
                  {status === 'pending' && (sponsorshipStatus.eligible ? 'Gasless Transaction Processing...' : 'Transaction Processing...')}
                </p>
                
                <p className={`text-sm mt-1 ${
                  status === 'success' ? 'text-green-700' :
                  status === 'error' ? 'text-red-700' :
                  'text-blue-700'
                }`}>
                  {status === 'success' && `Sent ${amount} USDC to ${formatAddress(recipient)} ${sponsorshipStatus.eligible ? 'with ZERO gas fees!' : 'successfully!'}`}
                  {status === 'error' && (error?.message || 'Please try again')}
                  {status === 'pending' && `Your ${sponsorshipStatus.eligible ? 'gasless ' : ''}transaction is being processed...`}
                </p>

                {hash && (
                  <a 
                    href={`https://sepolia.basescan.org/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 underline mt-2"
                  >
                    <span>View on BaseScan: {formatAddress(hash)}</span>
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
            {sponsorshipStatus.eligible 
              ? '⚡ <strong>Gas Sponsored:</strong> This transaction will be paid for by the paymaster service via your smart wallet.'
              : '💰 <strong>Gas Required:</strong> This transaction requires ETH for gas fees.'
            }
          </p>
        </div>

        {/* Paymaster Policy */}
        <div className="p-3 bg-gray-50 rounded border">
          <p className="text-xs text-gray-600">
            <strong>Sponsorship Policy:</strong> {paymasterService.getSponsorshipPolicy()} • 
            <strong> Max Amount:</strong> $1,000 USDC • 
            <strong> Allowed Contracts:</strong> USDC only • 
            <strong> Min Balance:</strong> 1 USDC required
          </p>
        </div>
      </div>
    </Card>
  );
}
