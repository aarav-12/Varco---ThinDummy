/* eslint-disable no-undef */
const pool = require("../db");

exports.getAllPatients = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM patients ORDER BY id DESC"
    );
    res.json({ patients: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
};

exports.getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM patients WHERE id = $1",
      [id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
};
