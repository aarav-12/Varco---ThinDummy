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

      // 🔥 FIX 1: prevent truncation
      max_tokens: 2000,
      temperature: 0,

      // 🔥 FIX 2: force structured JSON output
      system: [
        {
          type: "text",
          text: `

You are a medical report parser.

Return ONLY valid JSON.

STRICT RULES:

No markdown
No explanation
No extra text
Do not truncate
Always include value + unit
Skip biomarker if value or unit missing

FORMAT:
{
"biomarkers": [
{ "name": "HbA1c", "value": 7.0, "unit": "%" }
]
}
`
}
],

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

let output = data.content[0].text.trim();

// 🔥 FIX 3: clean markdown if Claude still adds it
if (output.startsWith("```")) {
  output = output.replace(/```json|```/g, "").trim();
}

return output;

} catch (error) {
console.error("🔥 CLAUDE ERROR:", error.message);

// keep your app safe (no crash)
return "AI is currently unavailable. Please consult a healthcare professional.";

}
};

module.exports = { callLLM };