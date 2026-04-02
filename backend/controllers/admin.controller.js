const pool = require("../db");

const adminLogin = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required"
      });
    }

    const result = await pool.query(
      `SELECT id, email, name FROM admins WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Unauthorized"
      });
    }

    return res.json({
      success: true,
      admin: result.rows[0]
    });

  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);
    return res.status(500).json({
      error: "Login failed"
    });
  }
};

module.exports = { adminLogin };