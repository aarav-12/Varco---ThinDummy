/* eslint-disable no-undef */
const express = require("express");
const router = express.Router();

const patientController = require("../controllers/patient.controller");


// CREATE PATIENT

router.post("/submit", patientController.submitPatient);


// GET ALL PATIENTS

router.get("/", patientController.getAllPatients);


// GET SINGLE PATIENT

router.get("/:id", patientController.getPatientById);

module.exports = router;