"use client";
import { useState, useEffect } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { ChatInterface } from "@/components/chat-interface";
import styles from "./page.module.css";

export default function Home() {
  const { isFrameReady, setFrameReady, context } = useMiniKit();

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  return (
    <div className={styles.container}>
      <button className={styles.closeButton} type="button">
        ✕
      </button>

      <div className={styles.content}>
        <div className={styles.waitlistForm}>
          <h1 className={styles.title}>FlowSend AI Assistant</h1>

          <p className={styles.subtitle}>
            Hey {context?.user?.displayName || "there"}, chat with your AI
            assistant to manage crypto operations on Base.
          </p>

          {/* Chat interface */}
          <div className="mt-8">
            <ChatInterface />
          </div>
        </div>
      </div>
    </div>
  );
}
