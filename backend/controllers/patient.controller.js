/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

const pool = require("../db");
const { runAlgorithm } = require("../services/algorithm.service");
const { generateExplanation } = require("../services/ai.service");

exports.submitPatient = async (req, res) => {
  try {
    console.log("📥 Incoming request body:", req.body);

    const {
      name,
      age,
      gender,
      painLevel,
      symptoms,
      canWalk,
      hasSwelling
    } = req.body;

    // ✅ Basic validation
    if (!name || painLevel === undefined) {
      return res.status(400).json({
        error: "Name and painLevel are required"
      });
    }

    // ✅ Build rawInputs object (source of truth)
    const rawInputs = {
      painLevel,
      symptoms: symptoms || null,
      canWalk: canWalk ?? null,
      hasSwelling: hasSwelling ?? null
    };

    // ✅ Run algorithm service
    const algoResult = runAlgorithm(rawInputs, age);

    console.log("🧠 Algorithm output:", algoResult);

    // ✅ Generate AI explanation (based on severity or deviation)
   const aiSummary = await generateExplanation({
  deviation: algoResult.deviation,
  severity: algoResult.biomarkerSeverity
});


    // ✅ Insert structured data into DB
    const result = await pool.query(
      `INSERT INTO patients 
      (name, age, gender, raw_inputs, biomarkers, risk_scores, biological_age, chronological_age, ai_summary)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, biological_age`,
      [
        name,
        age || null,
        gender || null,
        rawInputs,
        algoResult.biomarkers,
        algoResult.biomarkerSeverity,
        algoResult.biologicalAge,
        age || null,
        aiSummary || null
      ]
    );

    console.log("✅ Patient inserted with ID:", result.rows[0].id);

    return res.status(201).json({
      message: "Patient submitted successfully",
      patientId: result.rows[0].id,
      biologicalAge: result.rows[0].biological_age,
      deviation: algoResult.deviation,
      biomarkers: algoResult.biomarkers,
      severity: algoResult.biomarkerSeverity,
      aiSummary
    });

  } catch (error) {
    console.error("🔥 ERROR in submitPatient:", error.message);

    return res.status(500).json({
      error: "Submission failed"
    });
  }
};
