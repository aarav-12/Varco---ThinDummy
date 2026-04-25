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

  // 🔥 STEP 0: Map
  const { mapped, rejected } = mapBiomarkers(biomarkers);
  console.log("🧠 MAPPED BIOMARKERS:", mapped);

  if (!mapped || Object.keys(mapped).length === 0) {
    throw new Error("No valid biomarkers after mapping");
  }

  // 🔥 STEP 1: Flatten
  const flattened = {};
  const matched = [];

  for (const key in mapped) {
    flattened[key] = mapped[key].value ?? mapped[key];
    matched.push(key);
  }

  const biomarkerCount = Object.keys(flattened).length;

  // 🔥 STEP 1.5: Data quality
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
    throw new Error("At least 3 biomarkers required");
  }

  // 🔥 STEP 2: Core pipeline

  const zScores = calculateZScores(flattened, biomarkerReference);
  const severity = applyDirectionality(zScores, biomarkerReference);
  const cappedSeverity = severity;
  // OLD SEVERITY FLOW (COMMENTED AS REQUESTED — DO NOT REMOVE)
  // const domainScores = calculateDomainScores(severity, biomarkerReference);

  const domainScores = calculateDomainScores(severity, biomarkerReference);

  console.log("📊 DOMAIN SCORES:", domainScores);

  const compositeScore = calculateCompositeScore(domainScores, domainWeights);

  const ageResult = calculateBiologicalAge(compositeScore, age);

  const domainContributions = calculateDomainContributions(
    domainScores,
    domainWeights
  );

  const riskScore = calculateRiskScore(compositeScore);

  const activeDomains = Object.keys(domainScores).length;
  const totalDomains = Math.max(Object.keys(domainWeights || {}).length, 1);
  const coverageFactor = Number((activeDomains / totalDomains).toFixed(2));

  let confidence = calculateConfidence(flattened, biomarkerReference);
  confidence = confidence * confidenceMultiplier;

  return {
    biologicalAge: ageResult.biologicalAge,
    deltaAge: ageResult.deltaAge,

    matched,
    rejected,

    domainScores,
    domainContributions,

    compositeScore,
    rawCompositeScore: compositeScore,

    riskScore,

    severity: cappedSeverity,
    zScores,

    confidence,

    dataPoints: biomarkerCount,
    activeDomains,
    coverageFactor,

    coverageWarning:
      activeDomains < 5
        ? "Low domain coverage."
        : null,

    dataQuality,

    note:
      dataQuality === "low"
        ? "Limited biomarkers."
        : "Sufficient biomarkers.",

    algorithmVersion: "3.0"
  };
}

module.exports = {
  runAlgorithm
};