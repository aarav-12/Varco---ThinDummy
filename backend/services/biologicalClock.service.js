function calculateZScore(value, mean, sd) {
    return (value - mean) / sd;
}
function calculateZScores(patientBiomarkers, referenceData) {

  const zScores = {};

  for (const biomarker in patientBiomarkers) {

    const value = patientBiomarkers[biomarker];
    const ref = referenceData[biomarker];

    if (!ref) continue;

    const z = (value - ref.mean) / ref.sd;

    zScores[biomarker] = z;
  }

  return zScores;
}
function applyDirectionality(zScores, referenceData) {

  const severity = {};

  for (const biomarker in zScores) {

    let z = zScores[biomarker];
    const direction = referenceData[biomarker].direction;

    if (direction === "low_worse") {
      z = -z;
    }

    severity[biomarker] = Math.abs(z);
  }

  return severity;
}
function calculateDomainScores(severityScores, referenceData) {

  const domainBuckets = {};

  for (const biomarker in severityScores) {

    if (!referenceData[biomarker]) {
      console.warn(`Unknown biomarker: ${biomarker}`);
      continue;
    }

    const domain = referenceData[biomarker].domain;

    if (!domainBuckets[domain]) {
      domainBuckets[domain] = [];
    }

    domainBuckets[domain].push(severityScores[biomarker]);
  }

  const domainScores = {};

  for (const domain in domainBuckets) {

    const values = domainBuckets[domain];

    const mean =
      values.reduce((sum, v) => sum + v, 0) / values.length;

    domainScores[domain] = mean;
  }

  return domainScores;
}

function calculateCompositeScore(domainScores, domainWeights) {

  let compositeScore = 0;

  for (const domain in domainScores) {

    const score = domainScores[domain];
    const weight = domainWeights[domain] || 0;

    compositeScore += score * weight;
  }

  return compositeScore;
}
function calculateBiologicalAge(compositeScore, chronologicalAge, k = 1) {

  const deltaAge = compositeScore * k;

  const biologicalAge = chronologicalAge + deltaAge;

  return {
    deltaAge,
    biologicalAge
  };
}
module.exports = {
    calculateZScore,
    calculateZScores,
    applyDirectionality,
    calculateDomainScores,
    calculateCompositeScore,
    calculateBiologicalAge
};