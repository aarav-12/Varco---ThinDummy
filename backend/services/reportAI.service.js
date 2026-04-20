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