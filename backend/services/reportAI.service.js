/* eslint-disable no-undef */
console.log("📊 reportAI.service loaded");

const { callLLM } = require("./llm.service");


// 🔥 MAIN FUNCTION — AI BIOMARKER EXTRACTION
async function extractBiomarkersFromText(text) {

  // 🔹 PASS 1 — STRICT (real values only)
  const strictPrompt = [
    {
      role: "user",
      content: `
Extract biomarker values from this medical report.

STRICT RULES:
- Extract ONLY real lab values (mg/L, ng/mL, pg/mL, mg/dL, mL/min)
- IGNORE Z-scores, charts, graphs
- Return ONLY JSON
- No explanation

FORMAT:
{
  "CRP": { "value": number, "unit": "mg/L" },
  "IL6": { "value": number, "unit": "pg/mL" }
}

REPORT:
${text}
`
    }
  ];

  let response = await callLLM(strictPrompt);
  let parsed = safeParse(response);

  // 🔥 FALLBACK IF STRICT FAILS
  if (!parsed || Object.keys(parsed).length === 0) {
    console.log("⚠️ STRICT FAILED → FALLBACK MODE");

    const fallbackPrompt = [
      {
        role: "user",
        content: `
Extract ALL possible lab values from this medical report.

IMPORTANT:
- Extract ANY numeric medical value you see
- Do NOT worry about correctness
- Do NOT skip values because of formatting
- Tables, broken text, OCR - still extract
- Even partial or uncertain values are OK

Return STRICT JSON ARRAY:
[
  { "name": "CRP", "value": 2.5, "unit": "mg/L" }
]

DO NOT return empty array unless absolutely nothing exists.

REPORT:
${text}
`
      }
    ];

    response = await callLLM(fallbackPrompt);
    parsed = safeParse(response);

    // 🔥 convert array → object
    if (Array.isArray(parsed)) {
      const mapped = {};
      for (const item of parsed) {
        if (item.name && item.value !== undefined) {
          mapped[item.name] = {
            value: item.value,
            unit: item.unit || "unknown"
          };
        }
      }
      parsed = mapped;
    }
  }

  if (!parsed || Object.keys(parsed).length === 0) {
    throw new Error("AI could not extract biomarkers");
  }

  console.log("✅ Extracted Biomarkers:", parsed);

  return parsed;
}


// 🔥 SAFE JSON PARSER (handles markdown + bad output)
function safeParse(response) {
  try {
    let cleaned = response.trim();

    // remove markdown wrapping
    if (cleaned.startsWith("```")) {
      cleaned = cleaned
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
    }

    return JSON.parse(cleaned);

  } catch (err) {
    console.error("❌ PARSE FAIL:", response);
    return null;
  }
}


// 🔥 REPORT GENERATION (POST ENGINE)
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
    summary = `Biological age is elevated by ${deviation} years, indicating significant biomarker stress.`;
  } else if (deviation >= 1) {
    summary = `Biological age is slightly elevated by ${deviation} year(s). Moderate imbalance detected.`;
  } else {
    summary = `Biological age aligns with chronological age. Biomarkers are stable.`;
  }

  const recommendations = [];

  if (deviation >= 3) {
    recommendations.push("Consult a medical professional.");
    recommendations.push("Adopt corrective lifestyle interventions.");
  } else if (deviation >= 1) {
    recommendations.push("Improve sleep and physical activity.");
    recommendations.push("Monitor biomarkers regularly.");
  } else {
    recommendations.push("Maintain current lifestyle habits.");
  }

  return {
    summary,
    biomarkerBreakdown,
    recommendations
  };
}


// ✅ FINAL EXPORT
module.exports = {
  extractBiomarkersFromText,
  generateReport
};