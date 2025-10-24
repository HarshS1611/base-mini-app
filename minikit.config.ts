const ROOT_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  "http://localhost:3000";

/**
 * MiniApp configuration object. Must follow the mini app manifest specification.
 *
 * @see {@link https://docs.base.org/mini-apps/features/manifest}
 */
export const minikitConfig = {
  accountAssociation: {
    header: "",
    payload: "",
    signature: "",
  },
  baseBuilder: {
    allowedAddresses: [],
  },
  miniapp: {
    version: "1",
    name: "flowsend",
    subtitle: "Gasless Cross-Border Payment Platform",
    description:
      "FlowSend enables instant, zero-gas-fee global money transfers using USDC on Base blockchain with seamless bank on/off ramps powered by Circle API.",
    screenshotUrls: [
      `${ROOT_URL}/screenshots/dashboard.png`,
      `${ROOT_URL}/screenshots/deposit.png`,
      `${ROOT_URL}/screenshots/withdraw.png`,
    ],
    iconUrl: `https://base-batches-builder-track.devfolio.co/_next/image?url=https%3A%2F%2Fassets.devfolio.co%2Fhackathons%2Fbase-batches-builder-track%2Fprojects%2F526c839b6b3d429a8213d1e21628516f%2F627c3d60-8e7e-400c-92e6-0d18eca72e24.png&w=128&q=75`,
    splashImageUrl: `https://base-batches-builder-track.devfolio.co/_next/image?url=https%3A%2F%2Fassets.devfolio.co%2Fhackathons%2Fbase-batches-builder-track%2Fprojects%2F526c839b6b3d429a8213d1e21628516f%2F627c3d60-8e7e-400c-92e6-0d18eca72e24.png&w=128&q=75`,
    splashBackgroundColor: "#000000",
    homeUrl: ROOT_URL,
    webhookUrl: `${ROOT_URL}/api/webhook`,
    primaryCategory: "utility",
    tags: ["payment", "finance", "cross-border", "crypto", "usdc"],
    heroImageUrl: `https://base-batches-builder-track.devfolio.co/_next/image?url=https%3A%2F%2Fassets.devfolio.co%2Fhackathons%2Fbase-batches-builder-track%2Fprojects%2F526c839b6b3d429a8213d1e21628516f%2F627c3d60-8e7e-400c-92e6-0d18eca72e24.png&w=128&q=75`,
    tagline: "Send money globally with zero gas fees and instant settlement.",
    ogTitle: "FlowSend - Instant Gasless Cross-Border Payments",
    ogDescription:
      "FlowSend leverages Base blockchain & Circle APIs to make your international transfers instant, transparent, and affordable.",
    ogImageUrl: `https://base-batches-builder-track.devfolio.co/_next/image?url=https%3A%2F%2Fassets.devfolio.co%2Fhackathons%2Fbase-batches-builder-track%2Fprojects%2F526c839b6b3d429a8213d1e21628516f%2F627c3d60-8e7e-400c-92e6-0d18eca72e24.png&w=128&q=75`,
  },
} as const;
