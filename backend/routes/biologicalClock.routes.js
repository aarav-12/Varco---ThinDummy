const express = require("express");
const router = express.Router();

const { calculateBiologicalAgeController } = require("../controllers/biologicalClock.controller");

router.post("/calculate", calculateBiologicalAgeController);

module.exports = router;