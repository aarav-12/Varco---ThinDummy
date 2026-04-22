require("dotenv").config();

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";

/**
 * mode:
 * - "extract" → for PDF biomarker parsing
 * - "chat" → for chatbot responses
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
You are a medical lab report extraction engine.

STRICT RULES:

- Extract numbers EXACTLY as written in the report
- DO NOT modify decimals
- DO NOT divide, multiply, round, or normalize values
- DO NOT infer units
- DO NOT guess
- DO NOT fix anything

CRITICAL EXAMPLES:
31.266 must remain 31.266
109.428 must remain 109.428

If you output 3.1266 instead of 31.266 -> YOU ARE WRONG

OUTPUT FORMAT:
{
  "biomarkers": [
    { "name": string, "value": number, "unit": string }
  ]
}

RULES:
- ONLY JSON
- NO markdown
- NO explanation
- NO truncation

If unsure -> SKIP the biomarker
`;
      maxTokens = 2000;
    } else {
      // 💬 CHAT MODE
      systemPrompt = `
You are Predict Health AI, a concise health assistant.

RULES:
- Max 3-4 sentences
- Conversational tone
- No markdown
- No bullet points
- Answer directly
`;
      maxTokens = 300;
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
          temperature: 0,
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

    if (!response.ok) {
      console.error("❌ Claude API Error:", data);
      throw new Error(data.error?.message || "Claude request failed");
    }

    if (!data.content || !data.content[0]?.text) {
      throw new Error("Invalid Claude response structure");
    }

    let output = data.content[0].text.trim();

    if (output.includes("Aldolase")) {
      console.log("🧠 RAW LLM OUTPUT:", output);
    }

    // 🔥 CLEAN ONLY FOR EXTRACT MODE
    if (mode === "extract") {
      output = output.replace(/```json|```/g, "").trim();
    }

    return output;

  } catch (error) {
    console.error("🔥 CLAUDE ERROR:", error.message);

    // 🔒 SAFE FALLBACKS
    if (mode === "extract") {
      return JSON.stringify({ biomarkers: [] });
    }

    return "AI is currently unavailable. Please try again later.";
  }
};

module.exports = { callLLM };