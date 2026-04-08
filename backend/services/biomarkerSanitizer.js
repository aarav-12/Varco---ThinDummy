// services/biomarkerSanitizer.js

function normalizeUnits(biomarkers) {
  const normalized = {};

  // 🔥 STRICT SANITY BOUNDS (used for rejection, not warning)
  const SANITY_BOUNDS = {
    BDNF: { min: 1, max: 100 },        // ng/mL
    MMP9: { min: 50, max: 2000 },      // ng/mL
    CTXII: { min: 0.05, max: 2.0 },    // ng/mL
    MDA: { min: 0.1, max: 20 },        // µmol/L
    CRP: { min: 0.01, max: 50 }
  };

  // 🔥 UNIT NORMALIZER (handles ALL your earlier bugs)
  function normalizeUnit(unit) {
    if (!unit) return "";

    return unit
      .toLowerCase()
      .replace(/[µμ]/g, "u")     // µ → u
      .replace(/\s/g, "")        // remove spaces
      .replace(/\/1\.73m2$/, ""); // eGFR fix
  }

  function isPlausible(key, value) {
    const bounds = SANITY_BOUNDS[key];
    if (!bounds) return true;

    return value >= bounds.min && value <= bounds.max;
  }

  for (const key in biomarkers) {
    let { value, unit } = biomarkers[key];

    if (value == null) continue;

    const cleanKey = key.replace(/[^a-zA-Z0-9]/g, "");
    let cleanUnit = normalizeUnit(unit);

    console.log("CHECK:", key, value, unit);

    // 🧠 HEMOGLOBIN
    if (cleanKey.toLowerCase() === "hemoglobin") {
      if (cleanUnit === "mg/dl") {
        value = value / 100;
        unit = "g/dL";
      }
      if (value > 30) value = value / 10;
    }

    // 🍬 GLUCOSE
    if (cleanKey.toLowerCase().includes("glucose")) {
      if (cleanUnit === "mmol/l") {
        value = value * 18;
        unit = "mg/dL";
      }
    }

    // 🫀 LIPIDS
    if (
      cleanKey.toLowerCase().includes("cholesterol") ||
      cleanKey.toLowerCase() === "ldl" ||
      cleanKey.toLowerCase() === "hdl" ||
      cleanKey.toLowerCase().includes("triglycerides")
    ) {
      if (cleanUnit === "mmol/l") {
        value = value * 38.67;
        unit = "mg/dL";
      }
    }

    // 🧪 CREATININE
    if (cleanKey.toLowerCase() === "creatinine") {
      if (cleanUnit === "umol/l") {
        value = value / 88.4;
        unit = "mg/dL";
      }
    }

    // 🌞 VITAMIN D
    if (cleanKey.toLowerCase() === "vitamind") {
      if (cleanUnit === "nmol/l") {
        value = value / 2.5;
        unit = "ng/mL";
      }
    }

    // 🔥 eGFR FIX
    if (cleanKey.toLowerCase() === "egfr") {
      unit = "mL/min";
    }

    // 🔥 MDA FIX (ng/mL → µmol/L)
    if (cleanKey.toLowerCase() === "mda" && cleanUnit === "ng/ml") {
      value = value * 0.0345;
      unit = "µmol/L";
    }

    // 🚨 HARD REJECTIONS (MOST IMPORTANT PART)

    if (cleanKey.toLowerCase() === "bdnf" && value < 1) {
      console.log("🚨 REJECT BDNF (implausible):", value);
      continue;
    }

    if (cleanKey.toLowerCase() === "mmp9" && value < 50) {
      console.log("🚨 REJECT MMP9 (implausible):", value);
      continue;
    }

    // ❌ INVALID UNIT FORMAT (like x10^3/uL)
    if (cleanUnit.includes("x10") || cleanUnit.includes("^")) {
      console.log("🚨 REJECT INVALID UNIT:", key, unit);
      continue;
    }

    // ❌ FINAL PLAUSIBILITY FILTER
    if (!isPlausible(key, value)) {
      console.log("🚨 REJECT (out of bounds):", key, value);
      continue;
    }

    // ✅ FINAL CLEAN STORE
    normalized[key] = {
      value: Number(value),
      unit
    };
  }

  return normalized;
}

module.exports = { normalizeUnits };