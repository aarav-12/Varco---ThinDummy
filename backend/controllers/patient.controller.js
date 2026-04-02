/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

const pool = require("../db");
const { runAlgorithm } = require("../services/algorithm.service");
const { generateExplanation } = require("../services/ai.service");


// -----------------------------
// CREATE PATIENT
// -----------------------------
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

    if (!name || painLevel === undefined) {
      return res.status(400).json({
        error: "Name and painLevel are required"
      });
    }

    const rawInputs = {
      painLevel,
      symptoms: symptoms || null,
      canWalk: canWalk ?? null,
      hasSwelling: hasSwelling ?? null
    };

    const algoResult = runAlgorithm(rawInputs, age);

    console.log("🧠 Algorithm output:", algoResult);

    const aiSummary = await generateExplanation({
      deviation: algoResult.deviation,
      severity: algoResult.biomarkerSeverity
    });

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



// -----------------------------
// GET ALL PATIENTS
// -----------------------------
exports.getAllPatients = async (req, res) => {
  try {
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
    console.error("GET ALL PATIENTS ERROR:", error);
    return res.status(500).json({
      error: "Failed to fetch patients"
    });
  }
};



// -----------------------------
// GET SINGLE PATIENT
// -----------------------------
exports.getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("PATIENT FETCH:", id);

    // ✅ UUID validation
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
    console.error("GET PATIENT ERROR:", error);
    return res.status(500).json({
      error: "Failed to fetch patient"
    });
  }
};