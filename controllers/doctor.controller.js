/* eslint-disable no-undef */
//for connection of db and pool is the tool to talk to Postgres
const pool = require("../db");

//this is for doctor db
//get /api/doctor/patients
exports.getAllPatients = async (req, res) => {
  try {

    //return data from patiends table
    //order by id desc to get latest patient first
    const result = await pool.query(
      "SELECT * FROM patients ORDER BY id DESC"
    );

    //result.rows me db ka data ata hai
    res.json({ patients: result.rows });

    //error for db print
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
};

//function for patient detail
//get /api/doctor/patient/:id

exports.getPatientById = async (req, res) => {
  try {
    //get id from url
    const { id } = req.params;


    //return data from patients table where id matches
    const result = await pool.query(
      "SELECT * FROM patients WHERE id = $1",
      [id] //value for $1 is id from url
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database error" });
  }
};
