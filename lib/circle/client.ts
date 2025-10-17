import { v4 as uuidv4 } from 'uuid';

const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY;
const CIRCLE_API_BASE_URL = process.env.CIRCLE_API_BASE_URL || 'https://api-sandbox.circle.com';

/**
 * Circle API Client using Consumer API endpoints
 * These work with sandbox API keys without requiring business account verification
 */
export class CircleClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    if (!CIRCLE_API_KEY) {
      throw new Error('CIRCLE_API_KEY is not configured');
    }
    
    this.apiKey = CIRCLE_API_KEY.trim();
    this.baseUrl = CIRCLE_API_BASE_URL;
    
    console.log('🔧 Circle Client initialized (Consumer API):', {
      baseUrl: this.baseUrl,
      apiKeyPrefix: this.apiKey.substring(0, 20) + '...',
      environment: this.apiKey.startsWith('TEST_API_KEY:') ? 'sandbox' : 'production',
    });
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log('📡 Circle API Request:', {
      method: options.method || 'GET',
      url,
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      console.log('📥 Response:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error:', errorText);
        
        let errorMessage = `Circle API error: ${response.status}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Request failed:', error);
      throw error;
    }
  }

  /**
   * Get configuration (tests API connection)
   */
  async getConfiguration() {
    return this.request('/v1/configuration');
  }

  /**
   * Create a card (for deposits)
   */
  async createCard(params: {
    cardNumber: string;
    cvv: string;
    expMonth: number;
    expYear: number;
    billingDetails: {
      name: string;
      line1: string;
      city: string;
      district: string;
      postalCode: string;
      country: string;
    };
  }) {
    return this.request('/v1/cards', {
      method: 'POST',
      body: JSON.stringify({
        idempotencyKey: uuidv4(),
        keyId: process.env.CIRCLE_PUBLIC_KEY,
        encryptedData: params.cardNumber, // In production, encrypt with Circle's public key
        billingDetails: params.billingDetails,
        expMonth: params.expMonth,
        expYear: params.expYear,
      }),
    });
  }

  /**
   * Get list of cards
   */
  async getCards() {
    return this.request('/v1/cards');
  }

  /**
   * Create a payment (deposit)
   */
  async createPayment(params: {
    amount: {
      amount: string;
      currency: string;
    };
    source: {
      id: string;
      type: string;
    };
    verification?: string;
  }) {
    return this.request('/v1/payments', {
      method: 'POST',
      body: JSON.stringify({
        idempotencyKey: uuidv4(),
        ...params,
      }),
    });
  }

  /**
   * Create a payout (withdrawal)
   */
  async createPayout(params: {
    amount: {
      amount: string;
      currency: string;
    };
    destination: {
      type: string;
      id?: string;
      address?: string;
      chain?: string;
    };
    metadata?: any;
  }) {
    return this.request('/v1/payouts', {
      method: 'POST',
      body: JSON.stringify({
        idempotencyKey: uuidv4(),
        source: {
          type: 'wallet',
          id: 'master', // Use master wallet
        },
        ...params,
      }),
    });
  }

  /**
   * Get payout
   */
  async getPayout(payoutId: string) {
    return this.request(`/v1/payouts/${payoutId}`);
  }

  /**
   * Get balances
   */
  async getBalances() {
    return this.request('/v1/balances');
  }

  /**
   * Create blockchain address for deposits
   */
  async createDepositAddress(params: {
    currency: string;
    chain: string;
  }) {
    return this.request('/v1/wallets/addresses/deposit', {
      method: 'POST',
      body: JSON.stringify({
        idempotencyKey: uuidv4(),
        ...params,
      }),
    });
  }

  /**
   * Get deposit addresses
   */
  async getDepositAddresses() {
    return this.request('/v1/wallets/addresses/deposit');
  }

  /**
   * Create transfer (send USDC on-chain)
   */
  async createTransfer(params: {
    amount: {
      amount: string;
      currency: string;
    };
    destination: {
      type: string;
      address: string;
      chain: string;
    };
  }) {
    return this.request('/v1/transfers', {
      method: 'POST',
      body: JSON.stringify({
        idempotencyKey: uuidv4(),
        source: {
          type: 'wallet',
          id: 'master',
        },
        ...params,
      }),
    });
  }
}

let circleClientInstance: CircleClient | null = null;

export function getCircleClient(): CircleClient {
  if (!circleClientInstance) {
    circleClientInstance = new CircleClient();
  }
  return circleClientInstance;
}

export const circleClient = {
  getInstance: getCircleClient,
};
