import OpenAI from "openai";

/**
 * /api/openai.js
 * - Déployé sur Vercel : accessible à https://<projet>.vercel.app/api/openai
 * - Attendre un POST { messages: [...] } (format Chat Completions)
 */

const allowedOrigins = [
  "https://zialcoolo.github.io",
  // "https://your-shopify-domain.myshopify.com",
  "http://127.0.0.1:5500",
  "http://localhost:5500"
];

// (Optionnel) petit secret pour limiter l'usage depuis ton front
const EXPECTED_CLIENT_SECRET = process.env.CLIENT_SECRET || "";

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-client-secret");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Optional: check a simple client secret header to avoid public usage
  if (EXPECTED_CLIENT_SECRET) {
    const clientSecret = req.headers["x-client-secret"] || "";
    if (clientSecret !== EXPECTED_CLIENT_SECRET) {
      return res.status(401).json({ error: "Unauthorized (invalid client secret)" });
    }
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Missing server OPENAI_API_KEY" });
  }

  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing or invalid 'messages' in body" });
    }

    const client = new OpenAI({ apiKey });

    // Appel simple non-streaming (léger et suffisant pour ton cas)
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 800
    });

    return res.status(200).json(completion);
  } catch (err) {
    console.error("Proxy error:", err);
    const message = err?.message || "Internal server error";
    return res.status(500).json({ error: "OpenAI proxy error", message });
  }
}
