/* eslint-disable no-undef */
// services/algorithm.service.js

const {
  calculateZScores,
  applyDirectionality,
  calculateDomainScores,
  calculateCompositeScore,
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
  const domainScores = calculateDomainScores(severity, biomarkerReference);

  console.log("📊 DOMAIN SCORES:", domainScores);

  const compositeScore = calculateCompositeScore(
    domainScores,
    domainWeights
  );

  // 🚀 COVERAGE FIX
  const expectedDomains = 7;
  const activeDomains = Object.values(domainScores).filter(v => v > 0).length;
  const coverageFactor = 0.85 + 0.15 * (activeDomains / expectedDomains);

  const adjustedCompositeScore = compositeScore * coverageFactor;

  console.log("📊 ADJUSTED COMPOSITE:", adjustedCompositeScore);

  // 🔥 STEP 3 — NON-LINEAR AMPLIFICATION (MAIN FIX)
  const amplified =
    adjustedCompositeScore * (1 + 0.8 * adjustedCompositeScore);

  // 🔥 STEP 4 — BASE DELTA
  let delta = amplified * 8;

  // 🔥 STEP 5 — HIGH-RISK BOOST (CRITICAL FIX)
  let riskBoost = 0;

  if (flattened.IL6 && flattened.IL6 > 20) {
    riskBoost += 1.5;
  }

  if (flattened.MDA && flattened.MDA > 30) {
    riskBoost += 1;
  }

  if (flattened.Triglycerides && flattened.Triglycerides > 150) {
    riskBoost += 0.5;
  }

  if (flattened.CRPExtreme && flattened.CRPExtreme > 5) {
    riskBoost += 0.5;
  }

  // 🔥 STEP 6 — FINAL AGE
  const biologicalAge = age + delta + riskBoost;

  const domainContributions = calculateDomainContributions(
    domainScores,
    domainWeights
  );

  const riskScore = calculateRiskScore(adjustedCompositeScore);

  let confidence = calculateConfidence(flattened, biomarkerReference);
  confidence = confidence * confidenceMultiplier;

  return {
    biologicalAge: Number(biologicalAge.toFixed(1)),
    deltaAge: Number((biologicalAge - age).toFixed(2)),

    matched,
    rejected,

    domainScores,
    domainContributions,

    compositeScore: adjustedCompositeScore,
    rawCompositeScore: compositeScore,

    riskScore,

    severity,
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