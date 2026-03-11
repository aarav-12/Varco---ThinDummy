
// Z SCORE CALCULATION

function calculateZScore(value, mean, sd) {

  let z = (value - mean) / sd;

  // Outlier cap (±3 SD)
  if (z > 3) z = 3;
  if (z < -3) z = -3;

  return z;
}

function calculateZScores(patientBiomarkers, referenceData) {

  const zScores = {};

  for (const biomarker in patientBiomarkers) {

    const value = patientBiomarkers[biomarker];
    const ref = referenceData[biomarker];

    if (!ref) continue;

    const z = calculateZScore(value, ref.mean, ref.sd);

    zScores[biomarker] = z;
  }

  return zScores;
}


// DIRECTIONALITY ADJUSTMENT

function applyDirectionality(zScores, referenceData) {

  const severity = {};

  for (const biomarker in zScores) {

    const ref = referenceData[biomarker];
    if (!ref) continue;

    let z = zScores[biomarker];

    if (ref.direction === "low_worse") {
      z = -z;
    }

    severity[biomarker] = Math.abs(z);
  }

  return severity;
}


// DOMAIN SCORE CALCULATION

function calculateDomainScores(severityScores, referenceData) {

  const domainBuckets = {};

  for (const biomarker in severityScores) {

    const ref = referenceData[biomarker];

    if (!ref) {
      console.warn(`Unknown biomarker: ${biomarker}`);
      continue;
    }

    const domain = ref.domain;

    if (!domainBuckets[domain]) {
      domainBuckets[domain] = [];
    }

    domainBuckets[domain].push(severityScores[biomarker]);
  }

  const domainScores = {};

  for (const domain in domainBuckets) {

    const values = domainBuckets[domain];

    const rms =
  Math.sqrt(
    values.reduce((sum, v) => sum + v * v, 0) / values.length
  );

    domainScores[domain] = rms;
  }

  return domainScores;
}

function calculateDomainContributions(domainScores, domainWeights, k = 6) {

  const contributions = {};
  let weightSum = 0;

  for (const d in domainScores) {
    weightSum += domainWeights[d] || 0;
  }

  for (const d in domainScores) {
    const normalizedWeight = (domainWeights[d] || 0) / weightSum;
    const years = domainScores[d] * normalizedWeight * k;
    contributions[d] = Number(years.toFixed(2));
  }

  return contributions;
}

// COMPOSITE SEVERITY SCORE

function calculateCompositeScore(domainScores, domainWeights) {

  let weightSum = 0;

  for (const domain in domainScores) {
    weightSum += domainWeights[domain] || 0;
  }

  // Safety check
  if (weightSum === 0) return 0;

  let compositeScore = 0;

  for (const domain in domainScores) {

    const score = domainScores[domain];
    const originalWeight = domainWeights[domain] || 0;

    const normalizedWeight = originalWeight / weightSum;

    compositeScore += score * normalizedWeight;
  }

  return compositeScore;
}


// BIOLOGICAL AGE CALCULATION

function calculateBiologicalAge(compositeScore, chronologicalAge, k = 6) {

  const rawDeltaAge = compositeScore * k;

  const dampingFactor = 25;

  const adjustedDeltaAge =
    rawDeltaAge / (1 + Math.abs(rawDeltaAge) / dampingFactor);

  const biologicalAge = chronologicalAge + adjustedDeltaAge;

  return {
    deltaAge: Number(adjustedDeltaAge.toFixed(2)),
    biologicalAge: Number(biologicalAge.toFixed(1))
  };
}


// CONFIDENCE SCORE

function calculateConfidence(patientBiomarkers, referenceData) {

  const expected = Object.keys(referenceData).length;
  const received = Object.keys(patientBiomarkers).length;

  const confidence = received / expected;

  return Number(confidence.toFixed(2));
}


// MASTER BIOLOGICAL CLOCK FUNCTION

function runBiologicalClock(patientBiomarkers, age, referenceData, domainWeights) {

  const zScores = calculateZScores(patientBiomarkers, referenceData);

  const severity = applyDirectionality(zScores, referenceData);

  const domainScores = calculateDomainScores(severity, referenceData);

  const compositeScore = calculateCompositeScore(domainScores, domainWeights);

  const ageResults = calculateBiologicalAge(compositeScore, age);

  const confidence = calculateConfidence(patientBiomarkers, referenceData);

  return {

    biomarkers: patientBiomarkers,

    zScores,

    severity,

    domainScores,

    compositeScore,

    deltaAge: ageResults.deltaAge,

    biologicalAge: ageResults.biologicalAge,

    confidence

  };
}



// EXPORTS


module.exports = {

  calculateZScore,
  calculateZScores,
  applyDirectionality,
  calculateDomainScores,
  calculateCompositeScore,
  calculateBiologicalAge,
  calculateConfidence,
  runBiologicalClock

};