/* eslint-disable no-undef */

const { callLLM } = require("./llm.service");
const { chunkText } = require("../utils/chunkText");
const { calculateBiologicalAge } = require("./scoring.service");
const { mapBiomarkers } = require("../utils/biomarkerMapper");
const axios = require("axios");
const FormData = require("form-data");

function mergeBiomarkers(biomarkersArray) {
  const map = {};

  for (const b of biomarkersArray || []) {
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

      await new Promise(r => setTimeout(r, 1200 * (i + 1)));
    } catch (err) {
      await new Promise(r => setTimeout(r, 1200 * (i + 1)));
    }
  }

  return null;
}

async function extractBiomarkersFromText(fullText) {
  const chunks = chunkText(fullText, 6000);
  let allBiomarkers = [];

  for (const chunk of chunks) {
    try {
      const response = await callWithRetry([{ role: "user", content: chunk }]);

      if (!response) {
        continue;
      }

      const cleaned = response.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (parsed.biomarkers) {
        allBiomarkers.push(...parsed.biomarkers);
      }

      await new Promise(r => setTimeout(r, 800));
    } catch (err) {
      // Skip malformed chunk output
    }
  }

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

  let dobAge = null;
  let frontendAge = null;

  if (typeof age === "number") {
    frontendAge = normalizeAge(age);
  } else if (age && typeof age === "object") {
    dobAge = normalizeAge(age.dobAge);
    frontendAge = normalizeAge(age.frontendAge);
  }

  // 🔥 STEP 1 — EXTRACT
  let rawBiomarkers = [];
  let reportAge = null;
  let ageConfidence = null;

  try {
    const pythonPayload = await extractBiomarkersFromPython(file);

    rawBiomarkers = pythonPayload?.biomarkers || [];
    reportAge = normalizeAge(pythonPayload?.extractedAge);
    ageConfidence = pythonPayload?.ageConfidence || null;

    console.log("✅ USING PYTHON EXTRACTION");
  } catch (err) {
    console.log("⚠️ PYTHON FAILED → FALLBACK LLM");

    rawBiomarkers = await extractBiomarkersFromText(fullText);
  }

  // 🔥 STEP 2 — AGE RESOLUTION
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
    throw new Error("No valid age found");
  }

  console.log("🧪 RAW ARRAY:", rawBiomarkers);

  // 🔥 STEP 3 — MERGE (DEDUP RAW)
  const merged = mergeBiomarkers(rawBiomarkers);
  console.log("🧼 MERGED:", merged);

  // ✅ THIS IS WHAT FRONTEND NEEDS
  const rawBiomarkerArray = merged.map(b => ({
    name: b.name,
    value: b.value,
    unit: b.unit
  }));

  // 🔥 STEP 4 — MAP FOR SCORING ONLY
  const inputObject = {};

  for (const b of merged) {
    if (!b?.name || b.value == null) continue;

    inputObject[b.name] = {
      value: b.value,
      unit: b.unit
    };
  }

  const { mapped, rejected } = mapBiomarkers(inputObject);

  console.log("✅ MAPPED COUNT:", Object.keys(mapped).length);
  console.log("❌ REJECTED:", rejected);

  if (!mapped || Object.keys(mapped).length === 0) {
    throw new Error("No valid biomarkers after mapping");
  }

  // 🔥 STEP 5 — SCORING
  const result = calculateBiologicalAge(mapped, ageUsed);

  console.log("📊 DOMAIN SCORES:", result?.domainScores);
  console.log("===== FINAL BIO AGE =====", result?.biologicalAge);

  // 🔥 STEP 6 — RETURN (THIS FIXES EVERYTHING)
  return {
    biologicalAge: result.biologicalAge,
    deltaAge: result.deltaAge,
    compositeScore: result.compositeScore,
    domainScores: result.domainScores,
    severity: result.severity,

    // 🚀 CRITICAL FIX → RAW DATA FOR FRONTEND
    biomarkers: rawBiomarkerArray,

    ageUsed,
    ageSource
  };
}

module.exports = {
  extractBiomarkersFromText,
  mergeBiomarkers,
  processReport
};