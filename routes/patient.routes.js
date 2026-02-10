/* eslint-disable no-undef */
const express = require("express");
const router = express.Router();

const patientController = require("../controllers/patient.controller");

router.post("/submit", patientController.submitPatient);

module.exports = router;
