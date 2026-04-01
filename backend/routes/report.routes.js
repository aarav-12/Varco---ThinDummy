const express = require("express");
const router = express.Router();

const { getLatestReport } = require("../controllers/report.controller");

router.get("/latest", getLatestReport);

module.exports = router;