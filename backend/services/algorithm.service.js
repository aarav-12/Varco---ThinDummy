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

const biomarkerReference = require("../db/biomarkerReference");
const domainWeights = require("../db/domainWeights");

function runAlgorithm({ biomarkers, age }) {
  if (!biomarkers || !age) {
    throw new Error("Missing biomarkers or age");
  }

  // 🔥 STEP 1: Flatten values
  const flattened = {};
  for (const key in biomarkers) {
    flattened[key] = biomarkers[key].value ?? biomarkers[key];
  }

  const biomarkerCount = Object.keys(flattened).length;

  if (biomarkerCount < 2) {
    throw new Error("Minimum 2 biomarkers required");
  }

  // 🔥 STEP 2: Core biological clock pipeline

  const zScores = calculateZScores(flattened, biomarkerReference);

  const severity = applyDirectionality(zScores, biomarkerReference);

  const domainScores = calculateDomainScores(severity, biomarkerReference);

  const compositeScore = calculateCompositeScore(
    domainScores,
    domainWeights
  );

  const domainContributions = calculateDomainContributions(
    domainScores,
    domainWeights
  );

  const riskScore = calculateRiskScore(compositeScore);

  const ageResult = calculateBiologicalAge(
    compositeScore,
    age
  );

  const confidence = calculateConfidence(
    flattened,
    biomarkerReference
  );

  // 🔥 FINAL OUTPUT (aligned with your main API)

  return {
    biologicalAge: ageResult.biologicalAge,
    deltaAge: ageResult.deltaAge,

    domainScores,
    domainContributions,

    compositeScore,
    riskScore,

    severity,
    zScores,

    confidence,

    algorithmVersion: "2.0"
  };
}

module.exports = {
  runAlgorithm
};