/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const pool = require("../db");
const { calculateRisk } = require("../services/scoring.service");
const { generateExplanation } = require("../services/ai.service");

exports.submitPatient = async (req, res) => {
  try {
    console.log("📥 Incoming request body:", req.body);

    const {
      name,
      age,
      painLevel,
      symptoms,
      canWalk,
      hasSwelling
    } = req.body;

    // ✅ Basic validation
    if (!name || painLevel === undefined) {
      console.log("❌ Validation failed: name or painLevel missing");
      return res.status(400).json({
        error: "Name and painLevel are required"
      });
    }

    // ✅ Calculate risk safely
    const riskLevel = calculateRisk(painLevel);
    console.log("🧠 Risk calculated:", riskLevel);

    const aiSummary = await generateExplanation(riskLevel);
    console.log("🤖 AI summary generated:", aiSummary);

    // ✅ Insert into DB
    const result = await pool.query(
      `INSERT INTO patients 
      (name, age, pain_level, symptoms, can_walk, has_swelling, risk_level, ai_summary)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, risk_level`,
      [
        name,
        age || null,
        painLevel,
        symptoms || null,
        canWalk ?? null,
        hasSwelling ?? null,
        riskLevel,
        aiSummary || null
      ]
    );

    console.log("✅ Patient inserted with ID:", result.rows[0].id);

    return res.status(201).json({
      message: "Patient submitted successfully",
      patientId: result.rows[0].id,
      riskLevel: result.rows[0].risk_level,
      aiSummary: aiSummary

    });

  } catch (error) {
    console.error("🔥 ERROR in submitPatient:", error.message);

    return res.status(400).json({
      error: error.message
    });
  }
};
