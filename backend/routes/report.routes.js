const express = require("express");
const router = express.Router();
const multer = require("multer");

// 🔥 Controllers
const { getLatestReport } = require("../controllers/report.controller");
const { uploadReport } = require("../controllers/upload.controller");

// 🔥 Multer setup (memory storage)
const upload = multer();

// ✅ EXISTING ROUTE (keep this)
router.get("/latest", getLatestReport);

// 🚀 NEW ROUTE — PDF Upload
router.post("/upload", upload.single("file"), (req, res, next) => {
  console.log("🚀 UPLOAD ROUTE HIT");
  next();
}, uploadReport);

module.exports = router;