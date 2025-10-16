import { Address, parseUnits, formatUnits } from 'viem';
import { paymasterService } from './paymaster';

export interface TransactionRequest {
  to: Address;
  amount: string;
  currency: 'USDC' | 'ETH';
  recipient: string;
  description?: string;
}

export interface TransactionResult {
  hash: `0x${string}`;
  success: boolean;
  gasSponsored: boolean;
  error?: string;
}

export class TransactionService {
  private USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as Address; // Base Sepolia USDC

  /**
   * Prepare USDC transfer with paymaster sponsorship
   */
  async prepareUSDCTransfer(
    fromAddress: Address,
    toAddress: Address,
    amount: string
  ): Promise<{
    to: Address;
    data: `0x${string}`;
    value: bigint;
    gasSponsored: boolean;
    paymasterData?: {
      paymaster: Address;
      paymasterData: `0x${string}`;
    };
  }> {
    const amountWei = parseUnits(amount, 6); // USDC has 6 decimals

    // ERC20 transfer function signature: transfer(address,uint256)
    const transferData = `0xa9059cbb${toAddress.slice(2).padStart(64, '0')}${amountWei.toString(16).padStart(64, '0')}` as `0x${string}`;

    const transaction = {
      to: this.USDC_ADDRESS,
      value: BigInt(0),
      data: transferData
    };

    // Try to get paymaster sponsorship
    const paymasterData = await paymasterService.getPaymasterData(
      fromAddress,
      transaction
    );

    return {
      to: this.USDC_ADDRESS,
      data: transferData,
      value: BigInt(0),
      gasSponsored: paymasterData !== null,
      paymasterData: paymasterData || undefined
    };
  }

  /**
   * Execute sponsored transaction
   */
  async executeSponsoredTransaction(
    request: TransactionRequest,
    fromAddress: Address
  ): Promise<TransactionResult> {
    try {
      // Resolve recipient address
      const toAddress = await this.resolveRecipient(request.recipient);
      
      // Prepare transaction
      const txPrepared = await this.prepareUSDCTransfer(
        fromAddress,
        toAddress,
        request.amount
      );

      // Send to backend for execution
      const response = await fetch('/api/transactions/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction: txPrepared,
          fromAddress,
          recipient: request.recipient,
          amount: request.amount,
          currency: request.currency,
          description: request.description
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      return {
        hash: result.txHash,
        success: true,
        gasSponsored: txPrepared.gasSponsored,
      };
    } catch (error) {
      return {
        hash: '0x' as `0x${string}`,
        success: false,
        gasSponsored: false,
        error: error instanceof Error ? error.message : 'Transaction failed'
      };
    }
  }

  private async resolveRecipient(recipient: string): Promise<Address> {
    // Check if it's already an address
    if (recipient.startsWith('0x') && recipient.length === 42) {
      return recipient as Address;
    }

    // Check if it's a basename
    if (recipient.includes('.base')) {
      // In a real app, resolve basename to address
      return recipient as Address;
    }

    // Check local contacts
    try {
      const contacts = JSON.parse(localStorage.getItem('flowsend_contacts') || '[]');
      const contact = contacts.find((c: any) => 
        c.name.toLowerCase() === recipient.toLowerCase()
      );
      if (contact) return contact.address as Address;
    } catch (e) {
      // Ignore storage errors
    }

    // Default demo addresses
    const demoAddresses: Record<string, Address> = {
      'mom': '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      'dad': '0x123abc456789def012345678901234567890abcde',
      'alice': '0xabcdef123456789012345678901234567890abcd',
    };

    return demoAddresses[recipient.toLowerCase()] || demoAddresses['mom'];
  }
}

export const transactionService = new TransactionService();
