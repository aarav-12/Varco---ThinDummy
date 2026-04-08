/* eslint-disable no-undef */
// services/algorithm.service.js

const {
  calculateZScores,
  applyDirectionality,
  calculateDomainScores,
  calculateCompositeScore,
  calculateBiologicalAge,
  calculateConfidence,
  calculateDomainContributions,
  calculateRiskScore
} = require("./biologicalClock.service");

const { mapBiomarkers } = require("../utils/biomarkerMapper");

const biomarkerReference = require("../db/biomarkerReference");
const domainWeights = require("../db/domainWeights");

function runAlgorithm({ biomarkers, age }) {
  console.log("📥 INPUT BIOMARKERS:", biomarkers);

  if (!biomarkers || !age) {
    throw new Error("Missing biomarkers or age");
  }

  // 🔥 STEP 0: Map + normalize biomarkers
  const { mapped, rejected } = mapBiomarkers(biomarkers);
  console.log("🧠 MAPPED BIOMARKERS:", mapped);

  if (!mapped || Object.keys(mapped).length === 0) {
    throw new Error("No valid biomarkers after mapping");
  }

  console.log("🧪 RAW MAPPED INPUT:", mapped);

  // 🔥 STEP 1: Flatten values
  const flattened = {};
  const matched = [];
  const converted = [];

  for (const key in mapped) {
    flattened[key] = mapped[key].value ?? mapped[key];
    matched.push(key);
  }

  console.log("📊 REFERENCE KEYS:", Object.keys(biomarkerReference));
  console.log("📥 INPUT KEYS:", Object.keys(flattened));

  console.log("🧪 AFTER CONVERSION:", flattened);
  console.log("🔁 CONVERSIONS APPLIED:", converted);

  const biomarkerCount = Object.keys(flattened).length;

  // 🔥 STEP 1.5: Data quality scoring
  let dataQuality = "low";
  let confidenceMultiplier = 0.7;

  if (biomarkerCount >= 12) {
    dataQuality = "high";
    confidenceMultiplier = 1;
  } else if (biomarkerCount >= 8) {
    dataQuality = "medium";
    confidenceMultiplier = 0.85;
  }

  if (biomarkerCount < 3) {
    throw new Error("At least 3 biomarkers required for meaningful analysis");
  }

  // 🔥 STEP 2: Core biological clock pipeline

  const zScores = calculateZScores(flattened, biomarkerReference);

  const severity = applyDirectionality(zScores, biomarkerReference);

  const domainScores = calculateDomainScores(severity, biomarkerReference);

  console.log("📊 DOMAIN SCORES:", domainScores);

  const compositeScore = calculateCompositeScore(
    domainScores,
    domainWeights
  );

  // 🚀 STEP 2.5 — COVERAGE FIX (CRITICAL)
  const expectedDomains = 7;

  const activeDomains = Object.values(domainScores).filter(v => v > 0).length;

  const coverageFactor = 0.85 + 0.15 * (activeDomains / expectedDomains);

  const adjustedCompositeScore = compositeScore * coverageFactor;

  console.log("📊 ACTIVE DOMAINS:", activeDomains);
  console.log("📊 COVERAGE FACTOR:", coverageFactor);
  console.log("📊 ADJUSTED COMPOSITE:", adjustedCompositeScore);

  const domainContributions = calculateDomainContributions(
    domainScores,
    domainWeights
  );

  const riskScore = calculateRiskScore(adjustedCompositeScore);

  const ageResult = calculateBiologicalAge(
    adjustedCompositeScore,
    age
  );

  let confidence = calculateConfidence(
    flattened,
    biomarkerReference
  );

  // 🔥 apply data quality penalty
  confidence = confidence * confidenceMultiplier;

  // 🚀 FINAL OUTPUT

  return {
    biologicalAge: ageResult.biologicalAge,
    deltaAge: ageResult.deltaAge,

    matched,
    rejected,

    domainScores,
    domainContributions,

    compositeScore: adjustedCompositeScore, // ✅ IMPORTANT CHANGE
    rawCompositeScore: compositeScore,      // ✅ debug visibility

    riskScore,

    severity,
    zScores,

    confidence,

    dataPoints: biomarkerCount,
    activeDomains,

    coverageFactor,

    coverageWarning:
      activeDomains < 5
        ? "Low domain coverage. Some biological systems are not represented."
        : null,

    dataQuality,

    note:
      dataQuality === "low"
        ? "Limited biomarkers detected. Add more reports for higher accuracy."
        : "Sufficient biomarkers for reliable estimation.",

    algorithmVersion: "2.3"
  };
}

module.exports = {
  runAlgorithm
};