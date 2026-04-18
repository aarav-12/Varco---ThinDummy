/* eslint-disable no-undef */

require("dotenv").config();

const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-6";

const callLLM = async (messages) => {
  try {
    console.log("🔑 Claude Key:", process.env.CLAUDE_API_KEY?.slice(0, 10));

    if (!process.env.CLAUDE_API_KEY) {
      throw new Error("CLAUDE_API_KEY is missing in .env");
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
          max_tokens: 500,

          // ✅ SYSTEM CONTROL (IMPORTANT)
          system: [
            {
              type: "text",
              text: `
You are a health analysis assistant.

Your role:
- Explain medical reports in simple language
- Highlight potential risk areas
- Suggest actionable lifestyle improvements

Strict rules:
- Do NOT give medical diagnoses
- Do NOT prescribe medication
- Always recommend consulting a healthcare professional
`
            }
          ],

          // ✅ USE FULL CONVERSATION
          messages: messages
        })
      }
    );
    console.log("MODEL USED:", MODEL);
    

    const data = await response.json();
    console.log("🧠 FULL CLAUDE RESPONSE:", data);

    if (!response.ok) {
      console.error("❌ Claude API Error:", data);
      throw new Error(data.error?.message || "Claude request failed");
    }

    if (!data.content || !data.content[0]?.text) {
      console.error("❌ Invalid Claude response:", data);
      throw new Error("Invalid Claude response");
    }

    return data.content[0].text.trim();

  } catch (error) {
    console.error("🔥 CLAUDE ERROR:", error.message);

    return "AI is currently unavailable. Please consult a healthcare professional.";
  }
};

module.exports = { callLLM };