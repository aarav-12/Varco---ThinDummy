
const biomarkerReference = require("../db/biomarkerReference");

// Z SCORE CALCULATION

function calculateZScore(value, mean, sd) {
  let z = (value - mean) / sd;

  z = Math.max(-3, Math.min(3, z));

  return z;
}

function normalizeValue(name, value, unit) {
  const key = String(name || "").toLowerCase();
  const normalizedUnit = String(unit || "").replace(/\s+/g, "").toLowerCase();

  // EXAMPLES — can be expanded with lab-validated conversion factors
  if (key === "ckmm" && normalizedUnit === "ng/ml") {
    return value * 0.01; // adjust to U/L scale (example factor)
  }

  if (key === "aldolasea" && normalizedUnit === "ng/ml") {
    return value * 0.1; // adjust to U/L scale (example factor)
  }

  if (key === "comp" && normalizedUnit === "ng/ml") {
    return value;
  }

  if (key === "mda" && normalizedUnit === "ng/ml") {
    // align with µmol/L-style reference scale
    return value / 28.97;
  }

  return value;
}

function calculateZScores(patientBiomarkers, referenceData) {
  const zScores = {};

  for (const biomarker in patientBiomarkers) {
    const rawEntry = patientBiomarkers[biomarker];
    let value = rawEntry;
    let unit = "unknown";

    if (rawEntry && typeof rawEntry === "object") {
      // OLD RAW EXTRACTION (COMMENTED AS REQUESTED — DO NOT REMOVE)
      // const value = patientBiomarkers[biomarker];
      value = rawEntry.value;
      unit = rawEntry.unit || "unknown";
    }

    const ref = referenceData[biomarker];

    if (!ref) continue;

    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) continue;

    // OLD Z INPUT (COMMENTED AS REQUESTED — DO NOT REMOVE)
    // zScores[biomarker] = calculateZScore(value, ref.mean, ref.sd);
    const normalizedValue = normalizeValue(biomarker, numericValue, unit);

    zScores[biomarker] = calculateZScore(normalizedValue, ref.mean, ref.sd);
  }

  return zScores;
}


// DIRECTIONALITY

function applyDirectionality(zScores, referenceData) {
  const severity = {};
  const critical = ["HbA1c", "FastingGlucose", "CRP", "MDA"];

  for (const biomarker in zScores) {
    const ref = referenceData[biomarker];
    if (!ref) continue;

    let z = zScores[biomarker];

    if (ref.direction === "low_worse") {
      z = -z;
    }

    // OLD SEVERITY LOGIC (COMMENTED AS REQUESTED — DO NOT REMOVE)
    // const finalSeverity = Math.abs(z);
    // severity[biomarker] = Math.min(finalSeverity, 2);

    // OLD POSITIVE-CREDIT V1 (COMMENTED AS REQUESTED — DO NOT REMOVE)
    // let finalSeverity = Math.abs(z);
    // if (Math.abs(z) < 0.5) {
    //   finalSeverity = -0.2; // gives negative aging contribution
    // }
    // severity[biomarker] = Math.max(0, Math.min(finalSeverity, 2));

    // OLD V2 (COMMENTED AS REQUESTED — DO NOT REMOVE)
    // let finalSeverity = Math.abs(z);
    // if (Math.abs(z) < 0.5) {
    //   finalSeverity = -0.25; // stronger reward
    // }
    // finalSeverity = Math.max(-0.5, Math.min(finalSeverity, 2));
    // severity[biomarker] = finalSeverity;

    // OLD ONE-SIDED LOGIC (COMMENTED AS REQUESTED — DO NOT REMOVE)
    // let finalSeverity = Math.max(0, z);
    // if (Math.abs(z) < 0.5) {
    //   finalSeverity = -0.25; // stronger reward
    // }
    // finalSeverity = Math.max(-0.5, Math.min(finalSeverity, 2));
    // severity[biomarker] = finalSeverity;

    // NEW: signed severity keeps recovery signal
    let markerSeverity = z;

    // OLD CRITICAL MULTIPLIER (COMMENTED AS REQUESTED — DO NOT REMOVE)
    // if (critical.includes(biomarker)) {
    //   markerSeverity = markerSeverity * 1.8;
    // }

    if (critical.includes(biomarker)) {
      markerSeverity = markerSeverity * 1.5;
    }

    // OLD SQUARE PENALTY (COMMENTED AS REQUESTED — DO NOT REMOVE)
    // if (markerSeverity > 1) {
    //   markerSeverity = markerSeverity * markerSeverity;
    // }

    if (markerSeverity > 1.2) {
      markerSeverity = markerSeverity * markerSeverity;
    }

    let finalSeverity = markerSeverity;

    // keep reward zone active
    if (Math.abs(z) < 0.5) {
      finalSeverity = -0.25;
    }

    // OLD REWARD-KILLER (COMMENTED AS REQUESTED — DO NOT REMOVE)
    // finalSeverity = Math.max(0, markerSeverity);

    severity[biomarker] = finalSeverity;
  }

  return severity;
}


// DOMAIN SCORES

function calculateDomainScores(severityScores, referenceData) {
  const domainBuckets = {};

  // 🔹 GROUP BY DOMAIN
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
    const values = [...domainBuckets[domain]];

    // OLD DOMAIN AVERAGE (COMMENTED AS REQUESTED — DO NOT REMOVE)
    // const sum = values.reduce((sum, v) => sum + v, 0);
    // let avg = sum / values.length;

    // OLD TOP-HALF SCORING (COMMENTED AS REQUESTED — DO NOT REMOVE)
    // values.sort((a, b) => b - a);
    // const top = values.slice(0, Math.ceil(values.length / 2));
    // let avg = top.reduce((s, v) => s + v, 0) / top.length;

    // OLD SORT/WEIGHTED FLOW (COMMENTED AS REQUESTED — DO NOT REMOVE)
    // values.sort((a, b) => b - a);
    // const worst = values.slice(0, Math.ceil(values.length * 0.6));
    // const best = values.slice(Math.ceil(values.length * 0.6));
    // const worstAvg = worst.reduce((s, v) => s + v, 0) / worst.length;
    // const bestAvg = best.length > 0
    //   ? best.reduce((s, v) => s + v, 0) / best.length
    //   : 0;
    // let avg = (worstAvg * 0.7) + (bestAvg * 0.3);

    const positives = [];
    const negatives = [];

    for (const s of values) {
      if (s > 0) positives.push(s);
      else negatives.push(Math.abs(s));
    }

    const damageScore = positives.length
      ? positives.reduce((a, b) => a + b, 0) / positives.length
      : 0;

    const recoveryScore = negatives.length
      ? negatives.reduce((a, b) => a + b, 0) / negatives.length
      : 0;

    // OLD DIRECT SPLIT (COMMENTED AS REQUESTED — DO NOT REMOVE)
    // let domainScore = damageScore - (recoveryScore * 0.4);

    const maxRecovery = damageScore * 0.3;
    const effectiveRecovery = Math.min(recoveryScore, maxRecovery);

    let domainScore = damageScore - (effectiveRecovery * 0.4);

    // OLD DOMAIN FLOOR (COMMENTED AS REQUESTED — DO NOT REMOVE)
    // domainScore = computedValue;
    // OLD DOMAIN FLOOR (COMMENTED AS REQUESTED — DO NOT REMOVE)
    // domainScore = Math.max(0.25, domainScore);
    // OLD DOMAIN FLOOR (COMMENTED AS REQUESTED — DO NOT REMOVE)
    // domainScore = Math.max(0.18, domainScore);
    // Balanced clamp (prevents collapse but keeps separation)
    // OLD FLOOR (COMMENTED AS REQUESTED — DO NOT REMOVE)
    // domainScore = Math.max(0.08, domainScore);
    // OLD FLOOR (COMMENTED AS REQUESTED — DO NOT REMOVE)
    // domainScore = Math.max(0.15, domainScore);
    domainScore = Math.max(0.08, domainScore);

    // OLD SATURATION (COMMENTED AS REQUESTED — DO NOT REMOVE)
    // domainScores[domain] = Math.min(Number(domainScore.toFixed(4)), 1);
    // OLD SATURATION (COMMENTED AS REQUESTED — DO NOT REMOVE)
    // domainScores[domain] = Math.min(Number(domainScore.toFixed(4)), 0.85);
    domainScores[domain] = Math.min(Number(domainScore.toFixed(4)), 0.9);
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
  const values = Object.values(domainScores);

  if (values.length === 0) return 0;

  let weightSum = 0;

  for (const domain in domainScores) {
    weightSum += domainWeights[domain] || 0;
  }

  if (weightSum === 0) return 0;

  // OLD COMPOSITE OUTPUT (COMMENTED AS REQUESTED — DO NOT REMOVE)
  // let compositeScore = 0;
  // for (const domain in domainScores) {
  //   const score = domainScores[domain];
  //   const normalizedWeight = (domainWeights[domain] || 0) / weightSum;
  //   compositeScore += score * normalizedWeight;
  // }
  // OLD SOFTENING (COMMENTED AS REQUESTED — DO NOT REMOVE)
  // compositeScore = Math.pow(compositeScore, 0.85);
  // OLD FINAL SAFETY GUARD (COMMENTED AS REQUESTED — DO NOT REMOVE)
  // if (compositeScore < 0.2) compositeScore = 0.2;

  const max = Math.max(...values);

  // OLD AVG LOGIC (COMMENTED AS REQUESTED — DO NOT REMOVE)
  // const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  // Core composite (balanced risk model)
  // OLD WEIGHTING (COMMENTED AS REQUESTED — DO NOT REMOVE)
  // let compositeScore = 0.4 * max + 0.6 * avg;
  let compositeScore = 0.4 * max + 0.6 * avg;

  // NEW multi-domain escalation for cases where several systems are elevated
  // OLD ESCALATION (COMMENTED AS REQUESTED — DO NOT REMOVE)
  // const badDomains = values.filter((value) => value > 0.75).length;
  // if (badDomains >= 2) compositeScore += 0.03;
  // if (badDomains >= 3) compositeScore += 0.05;
  const highDomains = values.filter((value) => value >= 0.75).length;
  if (highDomains >= 2) compositeScore += 0.03;
  if (highDomains >= 3) compositeScore += 0.05;

  // Light shaping (keeps curve stable without collapsing scores)
  compositeScore = Math.pow(compositeScore, 0.95);

  if (compositeScore < 0.08) compositeScore = 0.08;

  return Number(compositeScore.toFixed(4));
}


// BIOLOGICAL AGE

function calculateBiologicalAge(compositeScore, chronologicalAge) {
  const age = chronologicalAge;

  // OLD NONLINEAR FORMULA (COMMENTED AS REQUESTED — DO NOT REMOVE)
  // const adjustedScore = Math.pow(compositeScore, 0.6);
  // const scaledImpact = Math.log(1 + adjustedScore * 2);
  // let biologicalAge = age + (scaledImpact * 3);

  // 🔥 SIMPLE + STABLE SCALING (NO MAGIC)
  // OLD FINAL MULTIPLIER (COMMENTED AS REQUESTED — DO NOT REMOVE)
  // let delta = (compositeScore - 0.5) * 40;
  // OLD MULTIPLIER (COMMENTED AS REQUESTED — DO NOT REMOVE)
  // let delta = (compositeScore - 0.5) * 28;
  // OLD MULTIPLIER (COMMENTED AS REQUESTED — DO NOT REMOVE)
  // let delta = (compositeScore - 0.5) * 29;
  let delta = (compositeScore - 0.5) * 29;

  // OLD DELTA CLAMP (COMMENTED AS REQUESTED — DO NOT REMOVE)
  // delta = Math.max(-15, Math.min(20, delta));

  let biologicalAge = age + delta;

  // OLD FINAL CAP (COMMENTED AS REQUESTED — DO NOT REMOVE)
  // if (biologicalAge > age + 10) {
  //   biologicalAge = age + 10;
  // }

  // OLD DELTA CLAMP (COMMENTED AS REQUESTED — DO NOT REMOVE)
  // const maxIncrease = 15;
  // const maxDecrease = -7;
  // let deltaAge = biologicalAge - age;
  // deltaAge = Math.max(maxDecrease, Math.min(maxIncrease, deltaAge));
  // biologicalAge = age + deltaAge;

  // OLD LEGACY CAP (COMMENTED AS REQUESTED — DO NOT REMOVE)
  // if (biologicalAge > age + 10) {
  //   biologicalAge = age + 10;
  // }

  console.log("🔥 NEW FORMULA ACTIVE", {
    compositeScore,
    delta
  });

  const adjustedDeltaAge = biologicalAge - age;

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

  // 🔥 BUILD DOMAIN → BIOMARKERS MAP
  const biomarkersByDomain = {};

  for (const key in zScores) {
    const domain = biomarkerReference[key]?.domain;

    if (!domain) continue;

    if (!biomarkersByDomain[domain]) {
      biomarkersByDomain[domain] = [];
    }

    biomarkersByDomain[domain].push(key);
  }

  const severity = applyDirectionality(zScores, referenceData);
  // OLD SEVERITY FLOW (COMMENTED AS REQUESTED — DO NOT REMOVE)
  // const domainScores = calculateDomainScores(severity, referenceData);

  const domainScores = calculateDomainScores(severity, referenceData);

  const compositeScore = calculateCompositeScore(domainScores, domainWeights);

  const ageResults = calculateBiologicalAge(compositeScore, age);

  const confidence = calculateConfidence(patientBiomarkers, referenceData);

  return {
    biomarkers: patientBiomarkers,
    zScores,
    severity,
    domainScores,
    biomarkersByDomain,
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