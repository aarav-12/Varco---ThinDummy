const express = require("express");
const router = express.Router();

const {
  getRecommendations,
  upsertRecommendation
} = require("../controllers/recommendations.controller");

router.get("/:patientId", getRecommendations);
router.put("/:patientId", upsertRecommendation);

module.exports = router;