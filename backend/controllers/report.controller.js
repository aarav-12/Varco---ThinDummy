const pool = require("../db");

const getLatestReport = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM reports 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      ["demo-user"]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No reports found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error("FETCH REPORT ERROR:", err.message);
    res.status(500).json({ error: "Failed to fetch report" });
  }
};

module.exports = { getLatestReport };