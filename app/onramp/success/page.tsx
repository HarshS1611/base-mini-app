'use client';
import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OnrampSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      router.push('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4 flex items-center justify-center">
      <Card className="p-8 max-w-md mx-auto text-center">
        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
        <h1 className="text-2xl font-bold text-green-800 mb-2">
          Onramp Successful!
        </h1>
        <p className="text-green-700 mb-6">
          Your USDC deposit has been initiated. Funds will appear in your wallet once the transaction is confirmed.
        </p>
        <Button onClick={() => router.push('/')} className="w-full">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to FlowSend
        </Button>
      </Card>
    </div>
  );
}
