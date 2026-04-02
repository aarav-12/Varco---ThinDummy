const pool = require("../db");


// -----------------------------
// GET RECOMMENDATIONS
// -----------------------------
const getRecommendations = async (req, res) => {
  try {
    const { patientId } = req.params;

    console.log("PATIENT ID RECEIVED:", patientId);

    // ✅ UUID validation (correct way)
    const uuidRegex = /^[0-9a-fA-F-]{36}$/;

    if (!patientId || !uuidRegex.test(patientId)) {
      return res.status(400).json({
        error: "Invalid patientId"
      });
    }

    const result = await pool.query(
      `SELECT domain, recommendation, updated_at
       FROM patient_recommendations
       WHERE patient_id = $1`,
      [patientId]
    );

    return res.json({
      success: true,
      recommendations: result.rows
    });

  } catch (error) {
    console.error("GET RECOMMENDATIONS ERROR:", error);
    return res.status(500).json({
      error: "Failed to fetch recommendations"
    });
  }
};



// -----------------------------
// UPSERT RECOMMENDATION
// -----------------------------
const upsertRecommendation = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { domain, recommendation } = req.body;

    console.log("UPSERT FOR:", patientId);

    // ✅ UUID validation
    const uuidRegex = /^[0-9a-fA-F-]{36}$/;

    if (!patientId || !uuidRegex.test(patientId)) {
      return res.status(400).json({
        error: "Invalid patientId"
      });
    }

    if (!domain || !recommendation) {
      return res.status(400).json({
        error: "Domain and recommendation are required"
      });
    }

    const result = await pool.query(
      `INSERT INTO patient_recommendations 
       (patient_id, domain, recommendation, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (patient_id, domain)
       DO UPDATE SET
         recommendation = EXCLUDED.recommendation,
         updated_at = NOW()
       RETURNING *`,
      [patientId, domain, recommendation]
    );

    return res.json({
      success: true,
      recommendation: result.rows[0]
    });

  } catch (error) {
    console.error("UPSERT RECOMMENDATION ERROR:", error);
    return res.status(500).json({
      error: "Failed to save recommendation"
    });
  }
};


module.exports = {
  getRecommendations,
  upsertRecommendation
};