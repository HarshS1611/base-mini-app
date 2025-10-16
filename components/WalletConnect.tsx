'use client';
import { ConnectWallet, Wallet, useGetETHBalance, useGetTokenBalance } from '@coinbase/onchainkit/wallet';
import { Identity, Avatar, Name, Address } from '@coinbase/onchainkit/identity';
import { useAccount, useBalance } from 'wagmi';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, ExternalLink } from 'lucide-react';
import { CONTRACTS, CHAIN_CONFIG, formatAddress } from '@/lib/utils';
import { TokenBalance } from '@coinbase/onchainkit/token';

export default function WalletConnect() {
  const { address, isConnected, chain } = useAccount();
  
  const { data: usdcBalance, refetch: refetchBalance } = useBalance({
    address,
    token: CONTRACTS.USDC,
  });


  const { roundedBalance: ethBalance } = useGetETHBalance(address);

  return (
    <Card className="p-4 mb-6">
      <Wallet/>
        
        {isConnected && address && (
          <div className="mt-4 space-y-3">
            {/* Wallet Info */}
            <div className="flex items-center justify-between">
              <Identity 
                address={address}
                className="flex items-center space-x-2"
                schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
              >
                <Avatar className="w-8 h-8" />
                <div>
                  <Name className="text-sm font-medium" />
                  <Address className="text-xs text-gray-600" />
                </div>
              </Identity>
              
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Zap className="w-3 h-3 mr-1" />
                  Gas Free
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {chain?.name}
                </Badge>
              </div>
            </div>

            {/* Balances */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 rounded border">
                <p className="text-xs text-gray-600">USDC Balance</p>
                <p className="font-semibold text-blue-600">
                  {usdcBalance?.formatted ? 
                    `${parseFloat(usdcBalance.formatted).toFixed(2)} USDC` : 
                    '0.00 USDC'
                  }
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded border">
                <p className="text-xs text-gray-600">ETH Balance</p>
                <p className="font-semibold text-gray-600">
                  {ethBalance ? 
                    `${parseFloat(ethBalance).toFixed(4)} ETH` : 
                    '0.0000 ETH'
                  }
                </p>
              </div>
            </div>

            {/* Network Info */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <span>Connected to {CHAIN_CONFIG.name}</span>
                <a 
                  href={CHAIN_CONFIG.blockExplorer}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center space-x-1 text-green-600">
                <Zap className="w-3 h-3" />
                <span>Gasless enabled</span>
              </div>
            </div>
          </div>
        )}
    </Card>
  );
}
