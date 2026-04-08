/* eslint-disable no-undef */
console.log("📊 reportAI.service loaded");

const { callLLM } = require("./llm.service");
const { fallbackExtract } = require("../utils/fallbackExtractor");

// 🔍 VALIDATOR
function isValidBiomarker(item) {
  return (
    item &&
    typeof item.name === "string" &&
    item.name.trim().length > 0 &&
    typeof item.value === "number" &&
    !isNaN(item.value)
  );
}

// 🔥 SAFE PARSER
function safeParse(response) {
  try {
    let cleaned = response.trim();

    const match = cleaned.match(/```json\s*([\s\S]*?)```/i);
    if (match) cleaned = match[1].trim();

    return JSON.parse(cleaned);

  } catch (err) {
    console.log("⚠️ JSON PARSE FAILED → attempting recovery");

    try {
      const match = response.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch {}

    try {
      const regex = /"name"\s*:\s*"([^"]+)"\s*,\s*"value"\s*:\s*([\d.]+)\s*,\s*"unit"\s*:\s*"([^"]*)"/g;

      const biomarkers = [];
      let m;

      while ((m = regex.exec(response)) !== null) {
        const value = parseFloat(m[2]);
        if (!isNaN(value)) {
          biomarkers.push({
            name: m[1],
            value,
            unit: m[3]
          });
        }
      }

      if (biomarkers.length > 0) {
        return { biomarkers };
      }

    } catch {}

    return null;
  }
}

// 🔥 MAIN FUNCTION
async function extractBiomarkersFromText(text) {

  const strictPrompt = [
    {
      role: "user",
      content: `
Extract ALL biomarkers from this medical report.

STRICT:
- Do NOT skip anything
- Return ONLY JSON

FORMAT:
{
  "biomarkers": [
    { "name": "CRP", "value": 0.8, "unit": "mg/L" }
  ]
}

REPORT:
${text}
`
    }
  ];

  // 🔥 CALL AI
  let response = await callLLM(strictPrompt);
  let parsed = safeParse(response);

  console.log("🧪 RAW RESPONSE:", response);
  console.log("🧪 PARSED INITIAL:", parsed);

  // 🔥 FORCE ARRAY FORMAT
  if (parsed && !Array.isArray(parsed.biomarkers)) {
    parsed = {
      biomarkers: Object.entries(parsed).map(([name, val]) => ({
        name,
        value: val.value,
        unit: val.unit || "unknown"
      }))
    };
  }

  let finalMap = {};

  // ✅ USE AI DATA (PRIMARY)
  if (parsed?.biomarkers) {
    parsed.biomarkers
      .filter(isValidBiomarker)
      .forEach(item => {
        finalMap[item.name] = {
          value: item.value,
          unit: item.unit || "unknown"
        };
      });
  }

  // 🔥 FALLBACK (ONLY ADD — NEVER REPLACE GOOD DATA)
  const fallback = fallbackExtract(text);

  for (const key in fallback) {
    if (!finalMap[key] || finalMap[key].unit === "unknown") {
      console.log("🛠️ FALLBACK ADDED:", key);
      finalMap[key] = fallback[key];
    }
  }

  // 🔥 CLEAN (remove z-score junk)
  const cleaned = {};
  for (const key in finalMap) {
    const unit = finalMap[key].unit?.toLowerCase() || "";
    if (!unit.includes("z")) {
      cleaned[key] = finalMap[key];
    }
  }

  // 🔥 JUST WARN — DO NOT RETRY OR OVERRIDE
  const CRITICAL = ["IL6", "MDA", "VEGF"];
  CRITICAL.forEach(k => {
    if (!cleaned[k]) {
      console.warn("⚠️ MISSING:", k);
    }
  });

  if (!cleaned || Object.keys(cleaned).length === 0) {
    throw new Error("No valid biomarkers extracted");
  }

  console.log("📊 FINAL COUNT:", Object.keys(cleaned).length);
  console.log("✅ FINAL EXTRACTED BIOMARKERS:", cleaned);

  return cleaned;
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
  generateReport
};