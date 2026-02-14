/* eslint-disable no-undef */

const pool = require("../db"); // ✅ Fixed path
const { generateExplanation } = require("../services/ai.service");
const { calculateRisk } = require("../services/scoring.service");

exports.chatWithAI = async (req, res) => {
  try {
    console.log("🔥 chatWithAI hit");

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
    console.log("⚡ About to call generateExplanation");

    // ✅ Generate AI explanation
    const aiResponse = await generateExplanation({
      painLevel: numericPainLevel,
      riskLevel,
      symptoms
    });

    console.log("⚡ generateExplanation returned");
    console.log("AI Response:\n", aiResponse);

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


exports.sendMessage = async (req,res) => {
  try {
    const {patientId, message, sender} = req.body;

    //validation here
    if (!patientId || !sender || !message) {
      return res.status(400).json({ error: "All fields required" });
    }

    const query = `
            INSERT INTO chat_messages (patient_id, sender, message)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;

    const values = [patientId, sender, message];

    const result = await pool.query(query, values);

    return res.status(201).json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};


// ✅ Added getMessages function (was missing)
exports.getMessages = async (req, res) => {
  try {
    const { patientId } = req.params;

    const query = `
      SELECT * FROM chat_messages
      WHERE patient_id = $1
      ORDER BY created_at ASC;
    `;

    const result = await pool.query(query, [patientId]);

    return res.status(200).json({
      success: true,
      messages: result.rows
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
};
