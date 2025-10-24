"use client";
import { useState } from "react";
import WalletConnect from "@/components/WalletConnect";
import GaslessPayment from "@/components/GaslessPayment";
import { ChatInterface } from "@/components/chat-interface";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  ArrowDownToLine,
  ArrowUpFromLine,
  Zap,
  Users,
  Bot,
} from "lucide-react";
import CircleDeposit from "@/components/CircleDeposit";
import CircleWithdraw from "@/components/CircleWithdraw";

export default function Home() {
  const [activeTab, setActiveTab] = useState("send");

  const tabs = [
    { id: "send", label: "Send", icon: Send },
    { id: "deposit", label: "Deposit", icon: ArrowDownToLine },
    { id: "withdraw", label: "Withdraw", icon: ArrowUpFromLine },
    { id: "chat", label: "AI Agent", icon: Bot },
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
            <p className="text-gray-600 text-sm">
              Send money like sending a text
            </p>
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
              variant={activeTab === tab.id ? "default" : "ghost"}
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
          {activeTab === "send" && <GaslessPayment />}
          {activeTab === "deposit" && <CircleDeposit />}
          {activeTab === "withdraw" && <CircleWithdraw />}
          {activeTab === "chat" && <ChatInterface />}
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
          <p>Built with OnchainKit • Circle Onramp/Offramp</p>
        </div>
      </div>
    </div>
  );
}
