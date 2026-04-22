const { extractTextFromPDF } = require("../services/pdfParser");
const { extractBiomarkersFromText, mergeBiomarkers } = require("../services/reportAI.service");
const { fallbackExtract } = require("../services/ruleExtractor");
const { runAlgorithm } = require("../services/algorithm.service"); // 🔥 IMPORTANT

const uploadReport = async (req, res) => {
  try {
    console.log("📄 FILE RECEIVED");

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: "No file uploaded" },
        data: null
      });
    }

    // 🔹 STEP 1 — Extract text
    const text = await extractTextFromPDF(req.file.buffer);
    console.log("📄 TEXT LENGTH:", text.length);

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: "Could not extract text from PDF" },
        data: null
      });
    }

    // 🔧 HELPERS
    function ruleToArray(ruleBiomarkers) {
      return Object.keys(ruleBiomarkers).map(key => ({
        name: key,
        value: ruleBiomarkers[key].value,
        unit: ruleBiomarkers[key].unit
      }));
    }

    function sanitizeBiomarkers({ biomarkers }) {
      if (!Array.isArray(biomarkers)) return [];

      return biomarkers
        .filter(item => item && item.name && item.value !== undefined)
        .map(item => ({
          name: item.name,
          value: Number(item.value),
          unit: item.unit || "unknown"
        }));
    }

    function buildBiomarkerMap(clean) {
      const biomarkerMap = {};
      for (const item of clean) {
        biomarkerMap[item.name] = {
          value: item.value,
          unit: item.unit
        };
      }
      return biomarkerMap;
    }

    // 🔹 STEP 2 — RULE BASED
    const ruleBiomarkers = fallbackExtract(text);
    console.log("🧩 RULE BIOMARKERS:", ruleBiomarkers);

    // 🔹 STEP 3 — AI
    let extracted = [];

    try {
      extracted = await extractBiomarkersFromText(text);
    } catch (e) {
      console.log("⚠️ AI extraction failed, continuing...");
    }

    const finalBiomarkers = mergeBiomarkers(extracted);
    console.log("✅ FINAL COUNT:", finalBiomarkers.length);

    // 🔹 STEP 4 — PICK SOURCE
    let rawArray;

    if (finalBiomarkers.length > 0) {
      console.log("✅ USING AI DATA");
      rawArray = finalBiomarkers;
    } else {
      console.log("⚠️ USING RULE-BASED FALLBACK");
      rawArray = ruleToArray(ruleBiomarkers);
    }

    console.log("🧪 RAW ARRAY:", rawArray);

    const clean = sanitizeBiomarkers({ biomarkers: rawArray });
    console.log("🧼 CLEANED:", clean);

    const map = buildBiomarkerMap(clean);
    console.log("🧠 FINAL MAP:", map);

    if (!map || Object.keys(map).length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: "No usable biomarkers found" },
        data: null
      });
    }

    // 🔥 STEP 5 — RUN ALGORITHM (DIRECT CALL)
    const age = Number(req.body.age) || 60;

    const result = runAlgorithm({
      biomarkers: map,
      age: age
    });

    // 🔥 STEP 5B — PERSIST BIOMARKERS (NEW)
    const patientId = req.body.patientId || req.query.patientId;

    if (patientId) {
      try {
        await pool.query(
          `UPDATE patients SET raw_inputs = $1, last_report_at = $2 WHERE id = $3`,
          [
            JSON.stringify({
              biomarkers: map,
              updatedAt: new Date().toISOString()
            }),
            new Date(),
            patientId
          ]
        );
        console.log("✅ Biomarkers persisted for patient:", patientId);
      } catch (e) {
        console.warn("⚠️ Failed to persist biomarkers:", e.message);
      }
    }

    // 🔥 STEP 6 — MISSING BIOMARKERS
    const CRITICAL = ["IL6", "MDA", "VEGF", "eGFR", "PTH"];
    const missingBiomarkers = CRITICAL.filter(k => !map[k]);

    // 🔥 STEP 7 — TOP FIXES
    const topFixes = [];

    if (map.HbA1c?.value > 5.7)
      topFixes.push("Reduce HbA1c: improve insulin sensitivity");

    if (map.LDL?.value > 100)
      topFixes.push("Lower LDL: improve diet and activity");

    if (map.VitaminD?.value < 30)
      topFixes.push("Increase Vitamin D");

    if (map.CRP?.value > 1)
      topFixes.push("Reduce inflammation");

    // 🔥 STEP 8 — FINAL RESPONSE (DUAL FORMAT SAFE)

    const biomarkerArray = Object.keys(map).map((key, i) => ({
      id: `parsed-b${i + 1}`,
      name: key,
      value: map[key].value,
      unit: map[key].unit,
      normalRange: "",
      min: 0,
      max: 100,
      status: "normal",
      trend: "stable",
      description: "",
      category: "General"
    }));

    return res.json({
      // ✅ KEEP YOUR ORIGINAL SYSTEM (UNCHANGED)
      success: true,
      data: {
        biologicalAge: result.biologicalAge ?? null,
        deltaAge: result.deltaAge ?? null,
        confidence: result.confidence ?? 0,
        dataPoints: result.dataPoints ?? 0,

        topIssues: result.topIssues ?? [],
        topFixes: topFixes.slice(0, 3),
        missingBiomarkers: missingBiomarkers ?? [],

        domainScores: result.domainScores ?? {},
        algorithmVersion: "3.0"
      },

      // ✅ ADD LOVABLE FORMAT (NEW)
      patient: {
        name: "Unknown",
        age: 60,
        gender: "unknown"
      },
      biomarkers: biomarkerArray
    });

  } catch (err) {
    console.error("UPLOAD ERROR:", err.message);

    return res.status(500).json({
      success: false,
      error: { message: "Failed to process report" },
      data: null
    });
  }
};

module.exports = { uploadReport };