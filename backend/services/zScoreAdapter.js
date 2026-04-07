function zScoreToApprox(biomarkers) {
  const adapted = {};

  const BASELINES = {
    CRP: { mean: 1.5, scale: 1.2, unit: "mg/L", min: 0.01 },
    IL6: { mean: 3.5, scale: 2.0, unit: "pg/mL", min: 0.1 },
    LDL: { mean: 100, scale: 30, unit: "mg/dL", min: 20 },
    HDL: { mean: 50, scale: 15, unit: "mg/dL", min: 10 },
    TG: { mean: 120, scale: 40, unit: "mg/dL", min: 20 },
    VitaminD: { mean: 30, scale: 10, unit: "ng/mL", min: 5 }
  };

  for (const key in biomarkers) {
    const z = Number(biomarkers[key].value);
    const ref = BASELINES[key];

    if (!ref || isNaN(z)) continue;

    // clamp z to reasonable range
    const zClamped = Math.max(-3, Math.min(3, z));

    let approx = ref.mean + zClamped * ref.scale;

    // enforce minimum (no negatives / nonsense)
    if (ref.min !== undefined) {
      approx = Math.max(ref.min, approx);
    }

    adapted[key] = {
      value: Number(approx.toFixed(2)),
      unit: ref.unit,
      derivedFrom: "z-score"
    };
  }

  return adapted;
}

module.exports = { zScoreToApprox };