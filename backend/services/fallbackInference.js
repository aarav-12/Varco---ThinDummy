function inferMissingBiomarkers(existing) {
  const inferred = {};

  // 🔥 INFLAMMATION CLUSTER
  if (existing.CRP && !existing.IL6) {
    inferred.IL6 = {
      value: 3.5,
      unit: "pg/mL",
      inferred: true,
      reason: "CRP present → assume baseline IL6"
    };
  }

  // 🔥 LIPID CLUSTER
  if (existing.TotalCholesterol && !existing.LDL) {
    inferred.LDL = {
      value: existing.TotalCholesterol.value * 0.6,
      unit: "mg/dL",
      inferred: true,
      reason: "estimated from TC"
    };
  }

  if (existing.LDL && !existing.HDL) {
    inferred.HDL = {
      value: 45,
      unit: "mg/dL",
      inferred: true,
      reason: "default healthy baseline"
    };
  }

  if (existing.LDL && !existing.Triglycerides) {
    inferred.Triglycerides = {
      value: 130,
      unit: "mg/dL",
      inferred: true,
      reason: "default metabolic baseline"
    };
  }

  // 🔥 RENAL CLUSTER
  if (existing.Creatinine && !existing.eGFR) {
    inferred.eGFR = {
      value: 80,
      unit: "mL/min",
      inferred: true,
      reason: "estimated normal renal function"
    };
  }

  // 🔥 BONE CLUSTER
  if (existing.VitaminD && !existing.PTH) {
    inferred.PTH = {
      value: 40,
      unit: "pg/mL",
      inferred: true,
      reason: "balanced endocrine assumption"
    };
  }

  return inferred;
}

module.exports = { inferMissingBiomarkers };