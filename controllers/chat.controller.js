/* eslint-disable no-undef */

const { generateExplanation } = require("../services/ai.service");
const { calculateRisk } = require("../services/scoring.service");

exports.chatWithAI = async (req, res) => {
  try {
    const { painLevel, symptoms } = req.body;

    // ✅ Validate painLevel properly
    if (painLevel === undefined || isNaN(Number(painLevel))) {
      return res.status(400).json({
        error: "Valid numeric painLevel is required"
      });
    }

    // ✅ Convert to number safely
    const numericPainLevel = Number(painLevel);

    if (numericPainLevel < 0 || numericPainLevel > 10) {
   return res.status(400).json({ error: "..." });
}


    // ✅ Recalculate risk on backend (DO NOT trust client)
    const riskLevel = calculateRisk(numericPainLevel);

    console.log("Computed Risk Level:", riskLevel);

    // (Optional future AI prompt structure)
    const prompt = `
You are a medical triage assistant.

Patient Details:
Pain Level: ${numericPainLevel}
Risk Level: ${riskLevel}
Symptoms: ${symptoms || "Not specified"}

Provide:
1. Risk explanation
2. Recommended next step
Keep it concise.
`;

    console.log("Structured Prompt:\n", prompt);

    // ✅ Generate AI explanation
    const aiResponse = await generateExplanation(riskLevel);

    return res.status(200).json({
      painLevel: numericPainLevel,
      riskLevel,
      explanation: aiResponse
    });

  } catch (error) {
    console.error("Chat AI Error:", error);
    return res.status(500).json({
      error: "Failed to generate AI response"
    });
  }
};
