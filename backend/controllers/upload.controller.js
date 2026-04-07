const { extractTextFromPDF } = require("../services/pdfParser");
const { extractBiomarkersFromText } = require("../services/reportAI.service");
const { extractBiomarkersRuleBased } = require("../services/ruleExtractor");
const { extractZScoreFallback } = require("../services/zScoreFallback");
const { zScoreToApprox } = require("../services/zScoreAdapter");
const { calculateBiologicalAgeController } = require("./biologicalClock.controller");
const uploadReport = async (req, res) => {
  try {
    console.log("📄 FILE RECEIVED");

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // 🔹 STEP 1 — Extract text from PDF
    const text = await extractTextFromPDF(req.file.buffer);
    console.log("📄 TEXT LENGTH:", text.length);

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        error: "Could not extract text from PDF"
      });
    }

    let biomarkers = {};

    // 1️⃣ RULE-BASED
    const ruleBiomarkers = extractBiomarkersRuleBased(text);
    console.log("🧩 RULE BIOMARKERS:", ruleBiomarkers);

    // 2️⃣ AI (fallback)
    let aiBiomarkers = {};

    try {
      aiBiomarkers = await extractBiomarkersFromText(text);
    } catch (e) {
      console.log("⚠️ AI extraction failed, continuing...");
    }

    // 🔥 MERGE
    biomarkers = {
      ...aiBiomarkers,
      ...ruleBiomarkers
    };

    // 3️⃣ FINAL FALLBACK → USE Z-SCORE DATA IF NOTHING FOUND
    if (Object.keys(biomarkers).length === 0) {
      console.log("⚠️ USING FALLBACK: Z-SCORE EXTRACTION");

      biomarkers = extractZScoreFallback(text);
    }

    const allowZScore = process.env.ALLOW_ZSCORE === "true";

    const isZScoreOnly = Object.values(biomarkers).every(b =>
      b.unit && b.unit.toLowerCase().includes("z")
    );

    if (isZScoreOnly) {
      if (!allowZScore) {
        return res.status(200).json({
          success: false,
          type: "UNSUPPORTED_REPORT",
          message: "This report contains only derived scores. Upload a raw report."
        });
      }

      console.log("⚠️ TEST MODE: converting Z-scores → approx values");

      biomarkers = zScoreToApprox(biomarkers);

      console.log("🔁 ADAPTED BIOMARKERS:", biomarkers);
    }

    if (!biomarkers || Object.keys(biomarkers).length === 0) {
      return res.status(400).json({
        error: "No usable biomarkers found"
      });
    }

    req.body = {
      patientId: "pdf-user",
      age: 60, // or extract later from PDF
      biomarkers
    };

    return calculateBiologicalAgeController(req, res);

  } catch (err) {
    console.error("UPLOAD ERROR:", err.message);

    res.status(500).json({
      error: "Failed to process report"
    });
  }
};

module.exports = { uploadReport };