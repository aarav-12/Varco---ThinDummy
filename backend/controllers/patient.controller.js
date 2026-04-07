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

    const { biomarkers, age: requestAge } = req.body;

    // 🔥 convert array → object map
    const biomarkerMap = {};

    if (Array.isArray(biomarkers)) {
      biomarkers.forEach(b => {
        if (b.name && b.value !== undefined) {
          biomarkerMap[b.name] = {
            value: Number(b.value),
            unit: b.unit || ""
          };
        }
      });
    }

    // 🔥 ensure age is number
    const numericAge = Number(requestAge);
    const safeAge = Number.isFinite(numericAge) ? Math.round(numericAge) : null;

    const rawInputs = {
      painLevel,
      symptoms: symptoms || null,
      canWalk: canWalk ?? null,
      hasSwelling: hasSwelling ?? null,
      biomarkers: biomarkerMap,
      age: safeAge
    };

    // ================= ALGORITHM =================
    console.log("🧠 STEP 2: Running algorithm...");

    const result = runAlgorithm({
      biomarkers: biomarkerMap,
      age: numericAge
    });

    console.log("✅ STEP 2 DONE:", result);

    if (!result) {
      throw new Error("Algorithm returned undefined");
    }

    // 🔥 SANITIZE VALUES (THIS IS THE FIX)
    const safeBiologicalAge = Number.isFinite(result.biologicalAge)
      ? Math.round(result.biologicalAge)
      : null;

    const safeDeviation = Number.isFinite(result.deviation)
      ? result.deviation
      : null;

    console.log("🧪 SANITIZED:", {
      safeBiologicalAge,
      safeDeviation
    });

    // ================= AI =================
    let aiSummary = null;

    try {
      console.log("🤖 STEP 3: Calling AI...");

      aiSummary = await generateExplanation({
        deviation: safeDeviation,
        severity: result.biomarkerSeverity
      });

      console.log("✅ STEP 3 DONE: AI response received");
    } catch (aiError) {
      console.error("⚠️ AI FAILED:", aiError.message);
      aiSummary = "AI summary unavailable";
    }

    // ================= DB =================
    console.log("🗄️ STEP 4: Inserting into DB...");

    const dbResult = await pool.query(
      `INSERT INTO patients 
      (name, age, gender, raw_inputs, biomarkers, risk_scores, biological_age, chronological_age, ai_summary)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING id, biological_age`,
      [
        name,
        safeAge,
        gender || null,
        rawInputs,
        result.biomarkers,
        result.biomarkerSeverity,
        safeBiologicalAge, // ✅ FIXED
        safeAge,
        aiSummary
      ]
    );

    console.log("✅ STEP 4 DONE: DB insert success");

    return res.status(201).json({
      message: "Patient submitted successfully",
      patientId: dbResult.rows[0].id,
      biologicalAge: safeBiologicalAge,
      deviation: safeDeviation,
      biomarkers: result.biomarkers,
      severity: result.biomarkerSeverity,
      aiSummary
    });

  } catch (error) {
    console.error("🔥 FULL ERROR:", error);

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