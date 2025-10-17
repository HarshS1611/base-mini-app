'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Building2, CheckCircle, Loader2 } from 'lucide-react';

interface ReceiverChoiceProps {
  amount: string;
  currency: string;
  senderName: string;
  transactionHash: string;
  recipientAddress: string;
  onChoiceSelected: (choice: 'crypto' | 'bank') => void;
}

export default function ReceiverChoice({
  amount,
  currency,
  senderName,
  transactionHash,
  recipientAddress,
  onChoiceSelected
}: ReceiverChoiceProps) {
  const [selectedChoice, setSelectedChoice] = useState<'crypto' | 'bank' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleChoice = async (choice: 'crypto' | 'bank') => {
    setSelectedChoice(choice);
    setIsProcessing(true);

    try {
      if (choice === 'bank') {
        // Initiate offramp process
        const response = await fetch('/api/offramp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            userAddress: recipientAddress,
            cashoutMethod: 'ACH_BANK_ACCOUNT',
            useSessionToken: true
          })
        });

        const result = await response.json();

        if (result.success) {
          // Open offramp window
          window.open(result.offrampUrl, '_blank', 'width=500,height=700');
        }
      }

      setIsCompleted(true);
      onChoiceSelected(choice);
      
    } catch (error) {
      console.error('Failed to process choice:', error);
      setSelectedChoice(null);
      setIsProcessing(false);
    }
  };

  if (isCompleted) {
    return (
      <Card className="p-6 bg-green-50 border-green-200 max-w-md mx-auto">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            {selectedChoice === 'crypto' ? '💎 Crypto Saved!' : '🏦 Bank Transfer Initiated!'}
          </h3>
          <p className="text-green-700 text-sm">
            {selectedChoice === 'crypto' 
              ? `${amount} ${currency} is now safely stored in your crypto wallet on Base Sepolia.`
              : `${amount} ${currency} is being converted to USD and will arrive in your bank account within 1-3 business days.`
            }
          </p>
          {selectedChoice === 'bank' && (
            <div className="mt-4 p-3 bg-blue-50 rounded border">
              <p className="text-xs text-blue-700">
                📱 You'll receive confirmation when your bank deposit completes.
              </p>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-2xl">💰</span>
        </div>
        <h2 className="text-xl font-bold mb-2">You've Received Money!</h2>
        <p className="text-gray-600">
          {senderName} sent you <strong>{amount} {currency}</strong> on Base Sepolia
        </p>
        <Badge variant="secondary" className="mt-2">
          Transaction: {transactionHash.slice(0, 10)}...
        </Badge>
      </div>

      {/* Choice Question */}
      <Card className="p-4 bg-amber-50 border-amber-200">
        <p className="text-center text-amber-800 font-medium">
          How would you like to receive your money?
        </p>
      </Card>

      {/* Options */}
      <div className="space-y-3">
        {/* Keep in Crypto */}
        <Card 
          className={`p-4 cursor-pointer transition-all border-2 ${
            selectedChoice === 'crypto' 
              ? 'border-purple-300 bg-purple-50' 
              : 'border-gray-200 hover:border-purple-200 hover:bg-purple-25'
          }`}
          onClick={() => !isProcessing && handleChoice('crypto')}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Wallet className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-purple-800">Keep as Crypto</h3>
              <p className="text-sm text-purple-600">
                Save {amount} USDC in your Base Sepolia wallet
              </p>
              <div className="flex items-center space-x-4 text-xs text-purple-500 mt-2">
                <span>✓ Instant</span>
                <span>✓ No fees</span>
                <span>✓ Keep full amount</span>
                <span>✓ Use for future sends</span>
              </div>
            </div>
            {selectedChoice === 'crypto' && isProcessing && (
              <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />
            )}
          </div>
        </Card>

        {/* Send to Bank */}
        <Card 
          className={`p-4 cursor-pointer transition-all border-2 ${
            selectedChoice === 'bank' 
              ? 'border-green-300 bg-green-50' 
              : 'border-gray-200 hover:border-green-200 hover:bg-green-25'
          }`}
          onClick={() => !isProcessing && handleChoice('bank')}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-800">Send to Bank</h3>
              <p className="text-sm text-green-600">
                Convert to USD and deposit to your bank account
              </p>
              <div className="flex items-center space-x-4 text-xs text-green-500 mt-2">
                <span>✓ Get cash</span>
                <span>✓ 1-3 days</span>
                <span>✓ ACH transfer</span>
                <span>✓ Direct deposit</span>
              </div>
            </div>
            {selectedChoice === 'bank' && isProcessing && (
              <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
            )}
          </div>
        </Card>
      </div>

      {/* Information */}
      <div className="space-y-3">
        <Card className="p-3 bg-blue-50 border-blue-200">
          <p className="text-xs text-blue-700">
            💡 <strong>Tip:</strong> You can always convert crypto to cash later, but bank transfers take 1-3 days to process.
          </p>
        </Card>

        <Card className="p-3 bg-gray-50">
          <p className="text-xs text-gray-600 text-center">
            Both options are secure and powered by Coinbase. Choose what works best for you!
          </p>
        </Card>
      </div>

      {/* Processing State */}
      {isProcessing && (
        <div className="text-center py-4">
          <div className="inline-flex items-center space-x-2 text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">
              {selectedChoice === 'crypto' 
                ? 'Keeping your crypto safe...'
                : 'Opening bank withdrawal window...'
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
