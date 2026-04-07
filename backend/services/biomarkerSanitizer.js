// services/biomarkerSanitizer.js

function normalizeUnits(biomarkers) {
  const normalized = {};

  // 🔥 SANITY BOUNDS (realistic clinical ranges)
  const SANITY_BOUNDS = {
    BDNF: { min: 1, max: 100 },        // ng/mL
    MMP9: { min: 50, max: 2000 },      // ng/mL
    CTXII: { min: 0.05, max: 2.0 },    // ng/mL
    MDA: { min: 0.1, max: 20 },        // µmol/L
    CRP: { min: 0.01, max: 50 },
  };

  function normalizeUnit(unit) {
    if (!unit) return "";

    return unit
      .toLowerCase()
      .replace(/[µμ]/g, "u")
      .replace(/\s/g, "")
      .replace(/\/1\.73m2$/, "");
  }

  function checkPlausibility(key, value) {
    const bounds = SANITY_BOUNDS[key];
    if (!bounds) return { ok: true };

    if (value < bounds.min || value > bounds.max) {
      return { ok: false, warning: "implausible" };
    }

    return { ok: true };
  }

  for (const key in biomarkers) {
    let { value, unit } = biomarkers[key];

    const warnings = [];

    if (value == null) {
      normalized[key] = {
        value: null,
        unit,
        warning: "missing_value"
      };
      continue;
    }

    let cleanUnit = normalizeUnit(unit);
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");

    console.log("CHECK:", key, value, unit);

    // 🧠 HEMOGLOBIN
    if (cleanKey === "hemoglobin") {
      if (cleanUnit === "mg/dl") {
        value = value / 100;
        unit = "g/dL";
      }
      if (value > 30) {
        value = value / 10;
      }
    }

    // 🍬 GLUCOSE
    if (cleanKey.includes("glucose")) {
      if (cleanUnit === "mmol/l") {
        value = value * 18;
        unit = "mg/dL";
      }
    }

    // 🫀 LIPIDS
    if (
      cleanKey.includes("cholesterol") ||
      cleanKey === "ldl" ||
      cleanKey === "hdl" ||
      cleanKey.includes("triglycerides")
    ) {
      if (cleanUnit === "mmol/l") {
        value = value * 38.67;
        unit = "mg/dL";
      }
    }

    // 🧪 CREATININE
    if (cleanKey === "creatinine") {
      if (cleanUnit === "umol/l") {
        value = value / 88.4;
        unit = "mg/dL";
      }
    }

    // 🌞 VITAMIN D
    if (cleanKey === "vitamind") {
      if (cleanUnit === "nmol/l") {
        value = value / 2.5;
        unit = "ng/mL";
      }
    }

    // 🔥 SPECIAL FIXES

    if (cleanKey === "egfr") {
      unit = "mL/min";
    }

    if (cleanKey === "bdnf") {
      if (value < 1) {
        value = value * 1000;
        warnings.push("unit_scaled_pg_to_ng");
      }
    }

    if (cleanKey === "mmp9") {
      if (value < 10) {
        warnings.push("low_value");
      }
    }

    // ❌ BAD UNIT CHECK
    if (cleanUnit.includes("x10") || cleanUnit.includes("^")) {
      warnings.push("invalid_unit_format");
    }

    // 🔍 PLAUSIBILITY CHECK
    const plausibility = checkPlausibility(key, value);
    if (!plausibility.ok) {
      warnings.push(plausibility.warning);
    }

    // ✅ FINAL STORE (NO OVERWRITING)
    normalized[key] = {
      value: Number(value),
      unit,
      ...(warnings.length > 0 && { warnings })
    };
  }

  return normalized;
}

module.exports = { normalizeUnits };