/* eslint-disable no-undef */
// services/algorithm.service.js

function normalize(value, min = 0, max = 10) {
  return Math.min(
    100,
    Math.max(0, ((value - min) / (max - min)) * 100)
  );
}

function getSeverity(score) {
  if (score <= 33) return "Mild";
  if (score <= 66) return "Moderate";
  return "Severe";
}

function calculateBiomarkers(rawInputs) {
  // Dummy logic — replace later

  const IRF = normalize(rawInputs.painLevel);
  const MHF = normalize(rawInputs.hasSwelling ? 8 : 2);
  const VAF = normalize(rawInputs.canWalk ? 3 : 7);
  const PNF = normalize(rawInputs.painLevel * 0.8);
  const CMF = normalize(5);
  const BMF = normalize(4);
  const RFF = normalize(6);

  return {
    IRF,
    MHF,
    VAF,
    PNF,
    CMF,
    BMF,
    RFF
  };
}

function calculateBiologicalAge(biomarkers, chronologicalAge) {
  const values = Object.values(biomarkers);
  const avgScore =
    values.reduce((a, b) => a + b, 0) / values.length;
    let ageDelta = 0; 
     if (avgScore < 30) ageDelta = 0;
  else if (avgScore < 50) ageDelta = 1;
  else if (avgScore < 70) ageDelta = 2;
  else ageDelta = 3;
//   const ageDelta = Math.round(avgScore * 0.05); // dummy scaling

  return chronologicalAge + ageDelta;
}

function generateSeverityMap(biomarkers) {
  const severity = {};

  for (let key in biomarkers) {
    severity[key] = getSeverity(biomarkers[key]);
  }

  return severity;
}

function runAlgorithm(rawInputs, chronologicalAge) {
  const biomarkers = calculateBiomarkers(rawInputs);

  const biologicalAge = calculateBiologicalAge(
    biomarkers,
    chronologicalAge
  );

  const biomarkerSeverity =
    generateSeverityMap(biomarkers);

  return {
    biomarkers,
    biologicalAge,
    deviation: biologicalAge - chronologicalAge,
    biomarkerSeverity
  };
}

module.exports = {
  runAlgorithm
};
