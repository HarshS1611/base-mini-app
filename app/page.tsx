'use client';
import { useState } from 'react';
import WalletConnect from '@/components/WalletConnect';
import GaslessPayment from '@/components/GaslessPayment';
import OnrampFlow from '@/components/OnrampFlow';
import OfframpFlow from '@/components/OfframpFlow';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, ArrowDownToLine, ArrowUpFromLine, Zap, Users } from 'lucide-react';
import OnRampPartnerCard from '@/components/OnrampFlow';
import CircleDeposit from '@/components/CircleDeposit';
import CircleWithdraw from '@/components/CircleWithdraw';

export default function Home() {
  const [activeTab, setActiveTab] = useState('send');
  const [showReceiverChoice, setShowReceiverChoice] = useState(false);

  // Mock receiver choice props
  const mockReceiverProps = {
    amount: '100',
    currency: 'USDC',
    senderName: 'Alice',
    transactionHash: '0x1234567890abcdef1234567890abcdef12345678',
    recipientAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    onChoiceSelected: (choice: 'crypto' | 'bank') => {
      console.log('Receiver chose:', choice);
      setShowReceiverChoice(false);
    }
  };

  const tabs = [
    { id: 'send', label: 'Send', icon: Send },
    { id: 'deposit', label: 'Deposit', icon: ArrowDownToLine },
    { id: 'withdraw', label: 'Withdraw', icon: ArrowUpFromLine },
  ];



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Send className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">
              Flow<span className="text-blue-600">Send</span>
            </h1>
          </div>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <p className="text-gray-600 text-sm">Send money like sending a text</p>
            <div className="flex items-center space-x-1 text-green-600">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-medium">Gas Free</span>
            </div>
          </div>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Base Sepolia Testnet
          </Badge>
        </div>

        {/* Wallet Connection */}
        <WalletConnect />

        {/* Navigation Tabs */}
        <div className="flex bg-white rounded-lg p-1 shadow-sm mb-6">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center space-x-2"
              size="sm"
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm">{tab.label}</span>
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'send' && <GaslessPayment />}
          {activeTab === 'deposit' && <CircleDeposit />}
          {activeTab === 'withdraw' && <CircleWithdraw />}
        </div>

        {/* Demo Receiver Choice */}
        <div className="mt-6">
          <Button 
            onClick={() => setShowReceiverChoice(true)}
            variant="outline"
            className="w-full flex items-center space-x-2"
          >
            <Users className="w-4 h-4" />
            <span>🎭 Simulate Receiver Experience</span>
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-gray-500">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span>Powered by Base Sepolia</span>
            <span>•</span>
            <div className="flex items-center space-x-1">
              <Zap className="w-3 h-3 text-green-500" />
              <span>Gasless via Paymaster</span>
            </div>
          </div>
          <p>Built with OnchainKit • Coinbase Onramp/Offramp</p>
        </div>
      </div>
    </div>
  );
}
