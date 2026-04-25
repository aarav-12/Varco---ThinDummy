/* eslint-disable no-undef */
console.log("📊 reportAI.service loaded");

const { callLLM } = require("./llm.service");
const { chunkText } = require("../utils/chunkText");
const { calculateBiologicalAge } = require("./scoring.service");
const { mapBiomarkers } = require("../utils/biomarkerMapper");
const axios = require("axios");
const FormData = require("form-data");

function mergeBiomarkers(biomarkersArray) {
  const map = {};

  for (const b of biomarkersArray) {
    if (!b || !b.name) continue;

    const key = b.name.toLowerCase().replace(/[^a-z0-9]/g, "");

    if (!map[key]) {
      map[key] = b;
    }
  }

  return Object.values(map);
}

async function callWithRetry(messages, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await callLLM(messages, "extract");

      if (
        res &&
        !res.includes("AI is currently unavailable") &&
        !res.includes("Overloaded")
      ) {
        return res;
      }

      console.log("⚠️ Retry attempt:", i + 1);
      await new Promise(r => setTimeout(r, 1200 * (i + 1)));
    } catch (err) {
      console.log("⚠️ Retry attempt:", i + 1);
      await new Promise(r => setTimeout(r, 1200 * (i + 1)));
    }
  }

  return null;
}

// 🔥 MAIN FUNCTION
async function extractBiomarkersFromText(fullText) {
  const chunks = chunkText(fullText, 6000);

  console.log("🧠 TOTAL CHUNKS:", chunks.length);

  let allBiomarkers = [];

  for (const chunk of chunks) {
    try {
      const response = await callWithRetry([{ role: "user", content: chunk }]);

      if (!response) {
        console.log("❌ Skipping chunk permanently");
        continue;
      }

      let cleaned = response
        .replace(/```json|```/g, "")
        .trim();

      const parsed = JSON.parse(cleaned);

      if (parsed.biomarkers) {
        allBiomarkers.push(...parsed.biomarkers);
      }

      await new Promise(r => setTimeout(r, 800));
    } catch (err) {
      console.log("❌ Chunk parse failed, skipping...");
    }
  }

  console.log("🧪 TOTAL BIOMARKERS:", allBiomarkers.length);

  return allBiomarkers;
}

async function extractBiomarkersFromPython(file) {
  if (!file?.buffer) {
    throw new Error("Missing upload buffer for Python extraction");
  }

  const form = new FormData();
  form.append("file", file.buffer, {
    filename: file.originalname || "report.pdf",
    contentType: file.mimetype || "application/pdf"
  });

  const response = await axios.post(
    process.env.PYTHON_API_URL,
    form,
    {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 30000
    }
  );

  // OLD RETURN (COMMENTED AS REQUESTED — DO NOT REMOVE)
  // return response?.data?.biomarkers || [];
  return response?.data || {};
}

async function processReport(fullText, age, file) {
  const normalizeAge = (raw) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    const rounded = Math.round(n);
    if (rounded < 1 || rounded > 120) return null;
    return rounded;
  };

  // Backward compatible input handling
  let dobAge = null;
  let frontendAge = null;

  if (typeof age === "number") {
    frontendAge = normalizeAge(age);
  } else if (age && typeof age === "object") {
    dobAge = normalizeAge(age.dobAge);
    frontendAge = normalizeAge(age.frontendAge);
  }

  // 1. Extract
  let rawBiomarkers = [];
  let reportAge = null;
  let ageConfidence = null;
  let pythonPayload = null;

  try {
    pythonPayload = await extractBiomarkersFromPython(file);
    rawBiomarkers = pythonPayload?.biomarkers || [];
    reportAge = normalizeAge(pythonPayload?.extractedAge);
    ageConfidence = pythonPayload?.ageConfidence || null;
    console.log("✅ USING PYTHON EXTRACTION IN processReport");
  } catch (pythonErr) {
    console.log("⚠️ PYTHON EXTRACTION FAILED IN processReport:", pythonErr.message);

    // OLD PATH (COMMENTED AS REQUESTED — DO NOT REMOVE)
    // rawBiomarkers = await extractBiomarkersFromText(fullText);

    rawBiomarkers = await extractBiomarkersFromText(fullText);
    console.log("⚠️ FALLING BACK TO LLM EXTRACTION IN processReport");
  }

  // 1.5 Resolve age source
  let ageUsed = null;
  let ageSource = null;

  if (dobAge != null) {
    ageUsed = dobAge;
    ageSource = "dob";
  } else if (frontendAge != null) {
    ageUsed = frontendAge;
    ageSource = "frontend";
  } else if (reportAge != null) {
    ageUsed = reportAge;
    ageSource = "report";
  }

  if (ageUsed == null) {
    throw new Error("No valid age provided from DOB, frontend, or report extraction");
  }

  const ageConflict =
    dobAge != null && reportAge != null && Math.abs(dobAge - reportAge) > 1;

  console.log("🧪 RAW ARRAY:", rawBiomarkers);

  // 2. Merge duplicates
  const merged = mergeBiomarkers(rawBiomarkers);
  console.log("🧼 MERGED:", merged);

  // 3. Convert to scoring format
  // OLD MANUAL MAPPING (COMMENTED AS REQUESTED — DO NOT REMOVE)
  // const mapped = {};
  //
  // for (const b of merged) {
  //   if (!b?.name || b.value == null) continue;
  //
  //   mapped[b.name] = {
  //     value: Number(b.value),
  //     unit: b.unit || ""
  //   };
  // }

  const inputObject = {};

  for (const b of merged) {
    if (!b?.name || b.value == null) continue;

    inputObject[b.name] = {
      value: b.value,
      unit: b.unit
    };
  }

  const { mapped, rejected } = mapBiomarkers(inputObject);
  const finalMap = mapped;

  console.log("✅ MAPPED COUNT:", Object.keys(mapped).length);
  console.log("❌ REJECTED:", rejected);

  console.log("🧠 FINAL MAP:", mapped);
  console.log("🚨 FINAL INPUT TO SCORING:", Object.keys(mapped));
  console.log("📥 FINAL BIOMARKERS FOR SCORING:", Object.keys(mapped).length);

  // 4. 🔥 CALL YOUR SCORING ENGINE
  // OLD AGE INPUT (COMMENTED AS REQUESTED — DO NOT REMOVE)
  // const result = calculateBiologicalAge(mapped, age);
  const result = calculateBiologicalAge(mapped, ageUsed);
  console.log("📊 DOMAIN SCORES:", result?.domainScores);
  console.log("===== FINAL BIO AGE =====", result?.biologicalAge);

  // 5. Generate report
  const report = generateReport({
    biologicalAge: result.biologicalAge,
    chronologicalAge: ageUsed,
    deviation: result.deltaAge,
    biomarkers: result.domainScores,
    severity: result.severity
  });

  const biomarkers = Object.entries(finalMap).map(([key, val]) => ({
    name: key,
    value: val.value,
    unit: val.unit,
  }));

  return {
    biologicalAge: result.biologicalAge,
    deltaAge: result.deltaAge,
    compositeScore: result.compositeScore,
    domainScores: result.domainScores,
    severity: result.severity,

    biomarkers,
  };
}

// 🔥 REPORT GENERATION
function generateReport({
  biologicalAge,
  chronologicalAge,
  deviation,
  biomarkers,
  severity
}) {
  const biomarkerBreakdown = Object.keys(biomarkers).map(key => ({
    name: key,
    score: biomarkers[key],
    severity: severity[key]
  }));

  let summary;

  if (deviation >= 3) {
    summary = `Biological age is elevated by ${deviation} years.`;
  } else if (deviation >= 1) {
    summary = `Biological age slightly elevated by ${deviation}.`;
  } else {
    summary = `Biological age aligned with chronological age.`;
  }

  return {
    summary,
    biomarkerBreakdown,
    recommendations: []
  };
}

module.exports = {
  extractBiomarkersFromText,
  mergeBiomarkers,
  generateReport,
  processReport
};