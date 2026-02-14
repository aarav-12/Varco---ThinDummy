/* eslint-disable no-undef */
//for connection of db and pool is the tool to talk to Postgres
const pool = require("../db");



// GET ALL PATIENTS

exports.getAllPatients = async (req, res) => {
  try {
    console.log("📤 Fetching all patients (triage mode)...");

    const result = await pool.query(`
      SELECT *
      FROM patients
      ORDER BY 
        CASE 
          WHEN risk_level = 'High' THEN 1
          WHEN risk_level = 'Moderate' THEN 2
          ELSE 3
        END,
        created_at ASC
    `);

    console.log(`✅ ${result.rows.length} patients fetched`);

    return res.status(200).json({
      count: result.rows.length,
      patients: result.rows
    });

  } catch (error) {
    console.error("Error fetching patients:", error.message);
    return res.status(500).json({ error: "Database error" });
  }
};



// ===============================
// GET PATIENT BY ID

exports.getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("📤 Fetching patient with ID:", id);

    // Validate ID
    if (!id || isNaN(Number(id))) {
      console.log("❌ Invalid patient ID");
      return res.status(400).json({ error: "Invalid patient ID" });
    }

    const result = await pool.query(
      "SELECT * FROM patients WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      console.log("❌ Patient not found");
      return res.status(404).json({ error: "Patient not found" });
    }

    console.log("✅ Patient found");

    return res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error("🔥 Error fetching patient:", error.message);
    return res.status(500).json({ error: "Database error" });
  }
};



// GET PATIENT BY ID

exports.getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("📤 Fetching patient with ID:", id);

    // Validate ID
    if (!id || isNaN(Number(id))) {
      console.log("❌ Invalid patient ID");
      return res.status(400).json({ error: "Invalid patient ID" });
    }

    const result = await pool.query(
      "SELECT * FROM patients WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      console.log("❌ Patient not found");
      return res.status(404).json({ error: "Patient not found" });
    }

    console.log("✅ Patient found");

    return res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error("🔥 Error fetching patient:", error.message);
    return res.status(500).json({ error: "Database error" });
  }
};
