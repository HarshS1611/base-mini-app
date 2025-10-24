# FlowSend - Base Mini App with AI Assistant

A Farcaster mini app on Base Sepolia that enables gasless payments, Circle on/off-ramp integration, and an **AI-powered chat assistant** to help users with crypto operations.

## Features

- **Gasless USDC Payments**: Send USDC without paying gas fees using Paymaster
- **Circle Integration**: Deposit and withdraw fiat using Circle's on/off-ramp
- **AI Chat Assistant**: Chat with an AI that helps you:
  - Understand your wallet and balances
  - Prepare token transfers (ETH, USDC)
  - Find testnet faucets
  - Learn about crypto and DeFi concepts
  - Navigate the Base ecosystem

## Getting Started

### Prerequisites

- Node.js 18 or higher
- Google Gemini API key

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up environment variables:

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:

- `GEMINI_API_KEY` - Your Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- `NEXT_PUBLIC_ONCHAINKIT_API_KEY` - Your OnchainKit API key from [Coinbase Developer Portal](https://portal.cdp.coinbase.com/)

Optional (for Circle integration):
- `CIRCLE_API_KEY` - Circle API key
- `CIRCLE_ENTITY_SECRET` - Circle entity secret

### Running the Application

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Using the AI Chat Assistant

The AI assistant is available in the "AI Agent" tab of the application.

### How It Works

This is a **conversational AI assistant** that helps guide you through crypto operations. Unlike traditional agent systems that control their own wallet, this assistant:

- **Guides you** through transactions using your connected wallet
- **Explains** what transactions will do before you execute them
- **Prepares** transaction data for you to review and approve
- **Educates** you about crypto concepts and best practices

**Important**: The AI cannot execute transactions directly. You remain in full control of your wallet and must approve all transactions.

### What the Assistant Can Help With

1. **Wallet Information**
   - "What's my wallet address?"
   - "How do I check my balance?"

2. **Token Transfers**
   - "I want to send 5 USDC to 0x..."
   - "How do I transfer ETH?"
   - "Prepare a transaction to send 10 USDC to my friend"

3. **Getting Test Tokens**
   - "I need test tokens"
   - "Where can I get testnet ETH?"
   - "Show me Base Sepolia faucets"

4. **Learning & Guidance**
   - "What's a smart wallet?"
   - "Explain how gasless transactions work"
   - "What is DeFi?"
   - "How do I use this app?"

### Example Conversations

```
User: I want to send 5 USDC to 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb