// services/scoring.service.js

const biomarkerReference = require("../db/biomarkerReference");
const domainWeights = require("../db/domainWeights");
const {
  runBiologicalClock
} = require("./biologicalClock.service");

function normalizeBiomarkerInput(inputBiomarkers) {
  if (!inputBiomarkers) return {};

  if (Array.isArray(inputBiomarkers)) {
    // OLD FLATTENING (COMMENTED AS REQUESTED — DO NOT REMOVE)
    // const flattened = {};
    const normalized = {};

    inputBiomarkers.forEach(item => {
      if (!item || !item.name) return;

      const value = item.value ?? item.score ?? item.amount;
      if (value === undefined || value === null || value === "") return;

      normalized[item.name] = {
        value: Number(value),
        unit: item.unit || "unknown"
      };
    });

    return normalized;
  }

  // OLD FLATTENING (COMMENTED AS REQUESTED — DO NOT REMOVE)
  // const flattened = {};
  const normalized = {};

  for (const [name, value] of Object.entries(inputBiomarkers)) {
    if (value == null) continue;

    if (typeof value === "object") {
      const numericValue = value.value ?? value.score ?? value.amount;
      if (numericValue === undefined || numericValue === null || numericValue === "") continue;
      normalized[name] = {
        value: Number(numericValue),
        unit: value.unit || "unknown"
      };
    } else {
      normalized[name] = {
        value: Number(value),
        unit: "unknown"
      };
    }
  }

  return normalized;
}

// -------------------
// BIO AGE FUNCTION
// -------------------
function calculateBiologicalAge(inputBiomarkers, age) {
  if (age === undefined || age === null || age === "") {
    throw new Error("Age is required");
  }

  const numericAge = Number(age);
  if (Number.isNaN(numericAge)) {
    throw new Error("Age must be a number");
  }

  const biomarkers = normalizeBiomarkerInput(inputBiomarkers);

  if (!biomarkers || Object.keys(biomarkers).length === 0) {
    throw new Error("No biomarkers provided");
  }

  const result = runBiologicalClock(
    biomarkers,
    numericAge,
    biomarkerReference,
    domainWeights
  );

  return {
    biologicalAge: result.biologicalAge,
    deltaAge: result.deltaAge,
    compositeScore: result.compositeScore,
    domainScores: result.domainScores,
    severity: result.severity,
    confidence: result.confidence
  };
}


// -------------------
// RISK FUNCTION (KEEP THIS)
// -------------------
function calculateRisk(painLevel) {
  if (painLevel === undefined || painLevel === null) {
    throw new Error("Pain level is required");
  }

  const pain = Number(painLevel);

  if (isNaN(pain)) {
    throw new Error("Pain level must be a number");
  }

  if (pain < 0 || pain > 10) {
    throw new Error("Pain level must be between 0 and 10");
  }

  if (pain >= 7) return "High";
  if (pain >= 4) return "Moderate";
  return "Low";
}


// -------------------
// EXPORT BOTH
// -------------------
module.exports = {
  calculateBiologicalAge,
  calculateRisk
};