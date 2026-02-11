/* eslint-disable no-undef */
const pool = require("../db");

exports.submitPatient = async (req, res) => {
  try {
    const { name, age, painLevel, symptoms } = req.body;

    const result = await pool.query(
      `INSERT INTO patients (name, age, pain_level, symptoms)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, age, painLevel, symptoms]
    );

    res.json({
      patientId: result.rows[0].id,
      status: "submitted",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
};
