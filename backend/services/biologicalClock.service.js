
// Z SCORE CALCULATION

function calculateZScore(value, mean, sd) {
  let z = (value - mean) / sd;

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

    zScores[biomarker] = calculateZScore(value, ref.mean, ref.sd);
  }

  return zScores;
}


// DIRECTIONALITY

function applyDirectionality(zScores, referenceData) {
  const severity = {};

  for (const biomarker in zScores) {
    const ref = referenceData[biomarker];
    if (!ref) continue;

    let z = zScores[biomarker];

    if (ref.direction === "low_worse") {
      z = -z;
    }

    severity[biomarker] = Math.max(0, z);
  }

  return severity;
}


// DOMAIN SCORES

function calculateDomainScores(severityScores, referenceData) {
  const domainBuckets = {};

  for (const biomarker in severityScores) {
    const ref = referenceData[biomarker];
    if (!ref) continue;

    const domain = ref.domain;

    if (!domainBuckets[domain]) {
      domainBuckets[domain] = [];
    }

    domainBuckets[domain].push(severityScores[biomarker]);
  }

  const domainScores = {};

  for (const domain in domainBuckets) {
    const values = domainBuckets[domain];

    // 🔥 Step 1: Biomarker-level amplification
    const boostedValues = values.map(v => {
      let boosted = v + 0.2 * Math.pow(v, 1.5);

      // 🔥 Extra boost for extreme biomarkers
      if (v > 2.5) {
        boosted *= 1.25;
        boosted += 0.5;
      }

      return boosted;
    });

    // 🔢 Step 2: Average
    const sum = boostedValues.reduce((sum, v) => sum + v, 0);
    const avg = sum / boostedValues.length;

    // 🔥 Step 3: Conditional stacking boost
    let stackingBoost = 1;
    if (avg > 0.6) {
      stackingBoost = 1 + 0.1 * Math.log1p(boostedValues.length);
    }

    const adjustedAvg = avg * stackingBoost;

    // 🔥 Step 4: Normalization
    let normalized = adjustedAvg / (1 + adjustedAvg);

    // 🔥 Step 5: Mild-domain damping (final calibration)
    if (adjustedAvg < 0.6) {
      normalized *= 0.75;
    }

    domainScores[domain] = Number(normalized.toFixed(4));
  }

  return domainScores;
}


// DOMAIN CONTRIBUTIONS

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


// COMPOSITE SCORE

function calculateCompositeScore(domainScores, domainWeights) {
  let weightSum = 0;

  for (const domain in domainScores) {
    weightSum += domainWeights[domain] || 0;
  }

  if (weightSum === 0) return 0;

  let compositeScore = 0;

  for (const domain in domainScores) {
    const score = domainScores[domain];
    const normalizedWeight = (domainWeights[domain] || 0) / weightSum;

    compositeScore += (score * normalizedWeight) * (1 - 0.2 * compositeScore);
  }

  const coverageFactor = Math.min(1, Object.keys(domainScores).length / 7);

  const adjusted = compositeScore * coverageFactor;

  // 🔥 Non-linear stacking
  const boosted = adjusted + 0.5 * (adjusted ** 2);

  return Number(boosted.toFixed(4));
}


// BIOLOGICAL AGE

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


// CONFIDENCE

function calculateConfidence(flattened, reference) {
  const total = Object.keys(reference).length;
  const present = Object.keys(flattened).length;

  let score = present / total;

  const domains = new Set();
  for (const key in flattened) {
    if (reference[key]) {
      domains.add(reference[key].domain);
    }
  }

  score += domains.size * 0.05;

  return Math.min(1, Number(score.toFixed(2)));
}


// MASTER FUNCTION

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


// RISK SCORE

function calculateRiskScore(compositeScore) {
  let riskScore = compositeScore * 2.5;

  if (riskScore > 10) riskScore = 10;
  if (riskScore < 0) riskScore = 0;

  return Number(riskScore.toFixed(2));
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
  runBiologicalClock,
  calculateRiskScore,
  calculateDomainContributions
};