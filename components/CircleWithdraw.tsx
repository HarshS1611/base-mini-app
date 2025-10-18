'use client';
import { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpFromLine, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { USDC_CONTRACT_ADDRESS } from '@/lib/constants';

export default function CircleWithdraw() {
  const [amount, setAmount] = useState('');
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedBank, setSelectedBank] = useState('');
  const [stage, setStage] = useState<'start' | 'processing' | 'done'>('start');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const { address, isConnected } = useAccount();
  const { data: balance, refetch } = useBalance({ address, token: USDC_CONTRACT_ADDRESS });

  useEffect(() => {
    if (!isConnected) return;
    (async () => {
      const r = await fetch('/api/circle/bank-accounts');
      const data = await r.json();
      if (data.success) {
        setBankAccounts(data.bankAccounts);
        setSelectedBank(data.bankAccounts[0]?.id);
      }
    })();
  }, [isConnected]);

  async function withdraw() {
    setLoading(true);
    setStage('processing');
    try {
      const res = await fetch('/api/circle/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, bankAccountId: selectedBank }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setStage('done');
      setMsg(`Withdrawal of $${amount} sent to bank.`);
      refetch?.();
    } catch (err) {
      setStage('start');
      setMsg(err instanceof Error ? err.message : 'Withdraw failed');
    } finally {
      setLoading(false);
    }
  }

  const usdc = parseFloat(balance?.formatted || '0').toFixed(2);

  if (!isConnected) {
    return (
      <Card className="p-6">
        <AlertCircle className="w-4 h-4 text-yellow-600 inline mr-2" />
        Please connect wallet
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <ArrowUpFromLine className="w-5 h-5 text-green-500" />
        <h3 className="text-lg font-semibold">Withdraw USDC → Bank</h3>
        <Badge variant="outline">Off-ramp</Badge>
      </div>

      <div className="p-3 bg-green-50 rounded border">
        <p className="text-sm text-gray-600">USDC Balance</p>
        <p className="text-xl font-bold text-green-700">{usdc} USDC</p>
      </div>

      {stage === 'start' && (
        <>
          <Input
            type="number"
            placeholder="Amount in USD"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button onClick={withdraw} disabled={loading || !amount} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Withdraw ${amount}
          </Button>
        </>
      )}

      {stage === 'processing' && (
        <Card className="p-5 bg-blue-50 border-blue-200 text-center">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600 mx-auto mb-2" />
          Processing withdrawal...
        </Card>
      )}

      {stage === 'done' && (
        <Card className="p-5 bg-green-50 border-green-200 text-center">
          <CheckCircle className="w-6 h-6 text-green-700 mx-auto mb-2" />{msg}
        </Card>
      )}
    </Card>
  );
}
