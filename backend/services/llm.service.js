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

    // EXTRACTION MODE DISABLED (commented out on request)
    // if (mode === "extract") {
    //   systemPrompt = `
    // You are a medical lab report extraction engine.
    // ...
    // `;
    //   maxTokens = 2000;
    // } else {
      
    // 💬 CHAT MODE ONLY
    const systemPrompt = `
You are Predict Health AI, a concise health assistant.

RULES:
- Max 3-4 sentences
- Conversational tone
- No markdown
- No bullet points
- Answer directly
`;
    const maxTokens = 300;

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

    // EXTRACTION OUTPUT CLEANUP DISABLED (commented out on request)
    // if (mode === "extract") {
    //   output = output.replace(/```json|```/g, "").trim();
    // }

    return output;

  } catch (error) {
    console.error("🔥 CLAUDE ERROR:", error.message);

    // EXTRACTION FALLBACK DISABLED (commented out on request)
    // if (mode === "extract") {
    //   return JSON.stringify({ biomarkers: [] });
    // }

    return "AI is currently unavailable. Please try again later.";
  }
};

module.exports = { callLLM };