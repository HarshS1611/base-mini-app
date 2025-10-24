import { withValidManifest } from "@coinbase/onchainkit/minikit";
import { minikitConfig } from "../../../minikit.config";

function withValidProperties(properties: Record<string, undefined | string | string[]>) {
  return Object.fromEntries(
      Object.entries(properties).filter(([_, value]) => (Array.isArray(value) ? value.length > 0 : !!value))
  );
}

const ROOT_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
  "http://localhost:3000";

export async function GET() {
  return Response.json({
    accountAssociation: {
      header: "",
      payload: "",
      signature: "",
    },
    baseBuilder: {
      allowedAddresses: ["0x357D015b64Ba0A9A4bF02f4C6352712cd5feF3Da"],
    },
    miniapp: {
      version: "1",
      name: "flowsend",
      subtitle: "Gasless Cross-Border Payment Platform",
      description:
        "FlowSend enables instant, zero-gas-fee global money transfers using USDC on Base blockchain with seamless bank on/off ramps powered by Circle API.",
      screenshotUrls: [
        `${ROOT_URL}/screenshots/flowsenLogo.png`,
      ],
      iconUrl: `${ROOT_URL}/flowsendLogo.png`,
      splashImageUrl: `${ROOT_URL}/flowsendLogo.png`,
      splashBackgroundColor: "#000000",
      homeUrl: ROOT_URL,
      webhookUrl: `${ROOT_URL}/api/webhook`,
      primaryCategory: "utility",
      tags: ["payment", "finance", "cross-border", "crypto", "usdc"],
      heroImageUrl: `${ROOT_URL}/flowsendLogo.png`,
      tagline: "Send money globally with zero gas fees and instant settlement.",
      ogTitle: "FlowSend - Instant Gasless Cross-Border Payments",
      ogDescription:
        "FlowSend leverages Base blockchain & Circle APIs to make your international transfers instant, transparent, and affordable.",
      ogImageUrl: `${ROOT_URL}/flowsendLogo.png`,
    },
  });
}
