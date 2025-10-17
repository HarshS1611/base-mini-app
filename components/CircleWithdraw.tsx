'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAccount, useBalance } from 'wagmi';
import { ArrowUpFromLine, Loader2, CheckCircle, AlertCircle, Building2 } from 'lucide-react';
import { USDC_CONTRACT_ADDRESS } from '@/lib/constants';

export default function CircleWithdraw() {
  const [amount, setAmount] = useState('50');
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const { address, isConnected } = useAccount();
  const { data: usdcBalance, refetch: refetchBalance } = useBalance({
    address,
    token: USDC_CONTRACT_ADDRESS,
  });

  // Load bank accounts
  useEffect(() => {
    if (!isConnected) return;

    const loadBankAccounts = async () => {
      try {
        setLoadingBanks(true);
        const response = await fetch('/api/circle/bank-accounts');
        const data = await response.json();

        if (data.success && data.bankAccounts) {
          setBankAccounts(data.bankAccounts);
          if (data.bankAccounts.length > 0) {
            setSelectedBank(data.bankAccounts[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to load bank accounts:', error);
      } finally {
        setLoadingBanks(false);
      }
    };

    loadBankAccounts();
  }, [isConnected]);

  const handleWithdraw = async () => {
    if (!address || !selectedBank || !amount) return;

    setIsLoading(true);
    setStatus('pending');
    setMessage('');

    try {
      const response = await fetch('/api/circle/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          bankAccountId: selectedBank,
          beneficiaryEmail: '', // Optional
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus('success');
        setMessage(data.message || 'Withdrawal initiated successfully');
        
        // Refresh balance
        setTimeout(() => refetchBalance(), 3000);
        
        // Reset form
        setTimeout(() => {
          setStatus('idle');
          setAmount('');
        }, 5000);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Withdrawal failed');
      
      setTimeout(() => setStatus('idle'), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const currentBalance = parseFloat(usdcBalance?.formatted || '0');
  const requestedAmount = parseFloat(amount || '0');

  if (!isConnected) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <ArrowUpFromLine className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold">Withdraw to Bank</h3>
          <Badge variant="outline">USDC → Bank</Badge>
        </div>
        
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              Please connect your wallet to withdraw funds.
            </p>
          </div>
        </Card>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-2 mb-4">
        <ArrowUpFromLine className="w-5 h-5 text-green-500" />
        <h3 className="text-lg font-semibold">Withdraw to Bank</h3>
        <Badge variant="outline">USDC → Bank</Badge>
      </div>

      <div className="space-y-4">
        {/* Current Balance */}
        <div className="p-3 bg-green-50 rounded border">
          <p className="text-sm text-gray-600">Available USDC Balance</p>
          <p className="text-xl font-bold text-green-600">
            {currentBalance.toFixed(2)} USDC
          </p>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Withdrawal Amount (USDC)</label>
          <Input
            type="number"
            placeholder="50"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isLoading}
            min="10"
            max={currentBalance.toString()}
            step="0.01"
          />
          <p className="text-xs text-gray-500">
            Will receive ~${amount} USD
          </p>
          {requestedAmount > currentBalance && (
            <p className="text-xs text-red-600">
              Insufficient balance. You have {currentBalance.toFixed(2)} USDC available.
            </p>
          )}
        </div>

        {/* Bank Account Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Bank Account</label>
          {loadingBanks ? (
            <div className="flex items-center space-x-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading bank accounts...</span>
            </div>
          ) : bankAccounts.length > 0 ? (
            <Select value={selectedBank} onValueChange={setSelectedBank} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select bank account" />
              </SelectTrigger>
              <SelectContent>
                {bankAccounts.map((bank) => (
                  <SelectItem key={bank.id} value={bank.id}>
                    {bank.description || `****${bank.accountNumber?.slice(-4)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Card className="p-3 bg-yellow-50 border-yellow-200">
              <p className="text-sm text-yellow-800">
                No bank accounts found. Please add a bank account first.
              </p>
            </Card>
          )}
        </div>

        {/* Transfer Info */}
        <div className="p-3 bg-gray-50 rounded border">
          <div className="flex items-center space-x-2 mb-2">
            <Building2 className="w-4 h-4 text-gray-600" />
            <p className="text-sm font-medium">Withdrawal Details</p>
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <p>✓ ACH Transfer: 3-5 business days</p>
            <p>✓ Wire Transfer: 1-2 business days</p>
            <p>✓ Direct deposit to your bank</p>
          </div>
        </div>

        {/* Withdraw Button */}
        <Button
          onClick={handleWithdraw}
          disabled={
            !isConnected ||
            !selectedBank ||
            !amount ||
            isLoading ||
            requestedAmount <= 0 ||
            requestedAmount > currentBalance ||
            requestedAmount < 10
          }
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <ArrowUpFromLine className="w-4 h-4" />
              <span>Withdraw ${amount} to Bank</span>
            </div>
          )}
        </Button>

        {/* Status Message */}
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
              
              <div>
                <p className={`font-medium ${
                  status === 'success' ? 'text-green-800' :
                  status === 'error' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  {status === 'success' && '✅ Withdrawal Initiated!'}
                  {status === 'error' && '❌ Withdrawal Failed'}
                  {status === 'pending' && '⏳ Processing Withdrawal...'}
                </p>
                <p className={`text-sm mt-1 ${
                  status === 'success' ? 'text-green-700' :
                  status === 'error' ? 'text-red-700' :
                  'text-blue-700'
                }`}>
                  {message}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Info */}
        <div className="p-3 bg-green-50 rounded border">
          <p className="text-xs text-green-700">
            💰 <strong>Powered by Circle:</strong> USDC will be converted to USD and deposited directly to your bank account.
          </p>
        </div>
      </div>
    </Card>
  );
}
