/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require("express");
const router = express.Router();

const doctorController = require("../controllers/doctor.controller");

router.get("/patients", doctorController.getAllPatients);
router.get("/patient/:id", doctorController.getPatientById);

module.exports = router;
