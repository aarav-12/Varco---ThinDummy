/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

const pool = require("../db");
const { runAlgorithm } = require("../services/algorithm.service");
const { generateExplanation } = require("../services/ai.service");

// ================= CREATE PATIENT =================

exports.submitPatient = async (req, res) => {
  try {
    console.log("📥 STEP 0: Incoming request body:", req.body);

    const {
      name,
      age,
      gender,
      painLevel,
      symptoms,
      canWalk,
      hasSwelling
    } = req.body;

    // ✅ VALIDATION
    if (!name || painLevel === undefined) {
      console.log("❌ STEP 1 FAIL: Missing required fields");
      return res.status(400).json({
        error: "Name and painLevel are required"
      });
    }

    console.log("✅ STEP 1: Validation passed");

    const rawInputs = {
      painLevel,
      symptoms: symptoms || null,
      canWalk: canWalk ?? null,
      hasSwelling: hasSwelling ?? null
    };

    // ================= ALGORITHM =================
    console.log("🧠 STEP 2: Running algorithm...");

    const algoResult = runAlgorithm(rawInputs, age);

    console.log("✅ STEP 2 DONE:", algoResult);

    if (!algoResult) {
      throw new Error("Algorithm returned undefined");
    }

    // ================= AI =================
    let aiSummary = null;

    try {
      console.log("🤖 STEP 3: Calling AI...");

      aiSummary = await generateExplanation({
        deviation: algoResult.deviation,
        severity: algoResult.biomarkerSeverity
      });

      console.log("✅ STEP 3 DONE: AI response received");
    } catch (aiError) {
      console.error("⚠️ AI FAILED:", aiError.message);

      // fallback so system doesn't crash
      aiSummary = "AI summary unavailable";
    }

    // ================= DB =================
    console.log("🗄️ STEP 4: Inserting into DB...");

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
        aiSummary
      ]
    );

    console.log("✅ STEP 4 DONE: DB insert success");

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
    console.error("🔥 FULL ERROR:", error); // FULL STACK TRACE

    return res.status(500).json({
      error: error.message || "Submission failed"
    });
  }
};

// ================= GET ALL PATIENTS =================

exports.getAllPatients = async (req, res) => {
  try {
    console.log("📤 Fetching all patients...");

    const result = await pool.query(
      `SELECT id, name, age, gender, created_at
       FROM patients
       ORDER BY created_at DESC`
    );

    return res.json({
      success: true,
      patients: result.rows
    });

  } catch (error) {
    console.error("🔥 GET ALL PATIENTS ERROR:", error);
    return res.status(500).json({
      error: "Failed to fetch patients"
    });
  }
};

// ================= GET SINGLE PATIENT =================

exports.getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🔍 STEP: Fetch patient ID:", id);

    const uuidRegex = /^[0-9a-fA-F-]{36}$/;

    if (!id || !uuidRegex.test(id)) {
      return res.status(400).json({
        error: "Invalid patient ID"
      });
    }

    const result = await pool.query(
      `SELECT *
       FROM patients
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Patient not found"
      });
    }

    return res.json({
      success: true,
      patient: result.rows[0]
    });

  } catch (error) {
    console.error("🔥 GET PATIENT ERROR:", error);
    return res.status(500).json({
      error: "Failed to fetch patient"
    });
  }
};