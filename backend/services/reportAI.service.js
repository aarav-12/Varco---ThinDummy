/* eslint-disable no-undef */
console.log("📊 reportAI.service loaded");

const { callLLM } = require("./llm.service");
const { chunkText } = require("../utils/chunkText");

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

// 🔥 MAIN FUNCTION
async function extractBiomarkersFromText(fullText) {
  const chunks = chunkText(fullText, 6000);

  console.log("🧠 TOTAL CHUNKS:", chunks.length);

  let allBiomarkers = [];

  for (const chunk of chunks) {
    try {
      const response = await callLLM(
        [{ role: "user", content: chunk }],
        "extract"
      );

      let cleaned = response
        .replace(/```json|```/g, "")
        .trim();

      const parsed = JSON.parse(cleaned);

      if (parsed.biomarkers) {
        allBiomarkers.push(...parsed.biomarkers);
      }
    } catch (err) {
      console.log("❌ Chunk parse failed, skipping...");
    }
  }

  return allBiomarkers;
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
  generateReport
};