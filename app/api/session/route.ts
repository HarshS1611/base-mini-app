import { generateJwt } from "@coinbase/cdp-sdk/auth";

const CDP_API_KEY = process.env.CDP_API_KEY_NAME;
const CDP_API_SECRET = process.env.CDP_API_KEY_SECRET;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const requestMethod = "POST";
    const requestHost = "api.developer.coinbase.com";
    const requestPath = "/onramp/v1/token";
    let jwt = "";

    try {
      // Use the CDP SDK to generate the JWT
      const token = await generateJwt({
        apiKeyId: CDP_API_KEY!,
        apiKeySecret: CDP_API_SECRET!,
        requestMethod: requestMethod,
        requestHost: requestHost,
        requestPath: requestPath,
        expiresIn: 120, // optional (defaults to 120 seconds)
      });
      console.log("Generated JWT:", token);

      jwt = token;
    } catch (error) {
      console.error("Error generating JWT:", error);
      throw error;
    }

    // Generate session token using CDP API with JWT
    const response = await fetch(
      "https://api.developer.coinbase.com/onramp/v1/token",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const errorData = await response.text();
      return new Response(
        JSON.stringify({
          error: `Failed to generate session token: ${response.status} ${errorData}`,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const data = await response.json();
    return new Response(JSON.stringify({ token: data.token }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Session token generation error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
