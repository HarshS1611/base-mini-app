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
    "accountAssociation": {  // these will be added in step 5
      "header": "",
      "payload": "",
      "signature": ""
    },
    "baseBuilder": {
      "ownerAddress": "0x" // add your Base Account address here
    },
    "miniapp": {
      "version": "1",
      "name": "Example Mini App",
      "homeUrl": "https://ex.co",
      "iconUrl": "https://ex.co/i.png",
      "splashImageUrl": "https://ex.co/l.png",
      "splashBackgroundColor": "#000000",
      "webhookUrl": "https://ex.co/api/webhook",
      "subtitle": "Fast, fun, social",
      "description": "A fast, fun way to challenge friends in real time.",
      "screenshotUrls": [
        "https://ex.co/s1.png",
        "https://ex.co/s2.png",
        "https://ex.co/s3.png"
      ],
      "primaryCategory": "social",
      "tags": ["example", "miniapp", "baseapp"],
      "heroImageUrl": "https://ex.co/og.png",
      "tagline": "Play instantly",
      "ogTitle": "Example Mini App",
      "ogDescription": "Challenge friends in real time.",
      "ogImageUrl": "https://ex.co/og.png",
      "noindex": true
    }
  });
}
