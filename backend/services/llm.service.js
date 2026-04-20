/* eslint-disable no-undef */

require("dotenv").config();

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";

/**
 * 🔥 UNIVERSAL LLM CALLER
 * mode:
 * - "chat" (default)
 * - "extract" (for PDF biomarker extraction)
 */
const callLLM = async (messages, mode = "chat") => {
  try {
    if (!process.env.CLAUDE_API_KEY) {
      throw new Error("CLAUDE_API_KEY is missing in .env");
    }

    let systemPrompt;
    let maxTokens;

    // 🔥 MODE SWITCH
    if (mode === "extract") {
      systemPrompt = `
You are a medical data extraction engine.

STRICT RULES:
- Extract biomarkers EXACTLY as written in the document
- DO NOT rename biomarkers
- DO NOT summarize
- DO NOT explain anything

OUTPUT FORMAT (STRICT JSON):
{
  "biomarkers": [
    { "name": string, "value": number, "unit": string }
  ]
}

CRITICAL:
- Preserve exact names
- Preserve exact units
- Extract only numeric values
- If unsure, SKIP the biomarker

NO markdown
NO extra text
ONLY JSON
`;
      maxTokens = 2000; //  keep this
    } else {
      // 💬 CHAT MODE
      systemPrompt = `
You are Predict Health AI, a concise health assistant.

RESPONSE RULES:
- Maximum 3-4 sentences
- Plain text only (no markdown, no bullets)
- Conversational tone
- No unnecessary disclaimers
- Answer directly
`;
      maxTokens = 300; //  clean and correct
    }

    const response = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "x-api-key": process.env.CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json"
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: maxTokens,
          system: [
            {
              type: "text",
              text: systemPrompt
            }
          ],
          messages
        })
      }
    );

    const data = await response.json();

    console.log("🧠 MODEL USED:", MODEL);
    console.log("🧠 LLM RESPONSE:", JSON.stringify(data).slice(0, 500));

    if (!response.ok) {
      console.error("❌ Claude API Error:", data);
      throw new Error(data.error?.message || "Claude request failed");
    }

    if (!data.content || !data.content[0]?.text) {
      throw new Error("Invalid Claude response structure");
    }

    return data.content[0].text.trim();

  } catch (error) {
    console.error("🔥 LLM ERROR:", error.message);

    // 🔒 SAFE FALLBACK
    if (mode === "extract") {
      return JSON.stringify({ biomarkers: [] });
    }

    return "AI is currently unavailable. Please try again later.";
  }
};

module.exports = { callLLM };