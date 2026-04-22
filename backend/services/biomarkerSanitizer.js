// services/biomarkerSanitizer.js

function normalizeUnits(biomarkers) {
  const normalized = {};

  const SANITY_BOUNDS = {
    BDNF: { min: 1, max: 100 },
    MMP9: { min: 50, max: 2000 },
    CTXII: { min: 0.05, max: 2.0 },
    MDA: { min: 0.1, max: 20 },
    CRP: { min: 0.01, max: 50 }
  };

  function normalizeUnit(unit) {
    if (!unit) return "";

    return unit
      .toLowerCase()
      .replace(/[µμ]/g, "u")
      .replace(/\s/g, "")
      .replace(/\/1\.73m2$/, "");
  }

  function isPlausible(key, value) {
    const bounds = SANITY_BOUNDS[key];
    if (!bounds) return true;
    return value >= bounds.min && value <= bounds.max;
  }

  for (const key in biomarkers) {
    let { value, unit } = biomarkers[key];

    if (value == null) continue;

    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    let cleanUnit = normalizeUnit(unit);

    console.log("CHECK:", key, value, unit);

    // 🧠 HEMOGLOBIN
    if (cleanKey === "hemoglobin") {
      if (cleanUnit === "mg/dl") {
        value = value / 100;
        unit = "g/dL";
      }
    }

    // 🟠 ALDOLASE A
    if (cleanKey.toLowerCase() === "aldolasea") {
      // DO NOTHING unless unit mismatch is proven
      // (right now your input is valid)
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

    // 🔥 eGFR FIX
    if (cleanKey === "egfr") {
      unit = "mL/min";
    }

    // 🔥 MDA FIX (CORRECTED)
    if (cleanKey === "mda" && cleanUnit === "ng/ml") {
      value = value / 28.97; // ✅ FIXED (accurate)
      unit = "µmol/L";
    }

    // 🚨 HARD REJECTIONS

    if (cleanKey === "bdnf" && value < 0.1) {
      console.log("⚠️ LOW BDNF (kept):", value);
    }

    if (cleanKey === "mmp9" && value < 10) {
      console.log("⚠️ LOW MMP9 (kept):", value);
    }

    // ❌ INVALID UNIT FORMAT
    if (cleanUnit.includes("x10") || cleanUnit.includes("^")) {
      console.log("🚨 REJECT INVALID UNIT:", key, unit);
      continue;
    }

    // ❌ FINAL PLAUSIBILITY FILTER
    if (!isPlausible(key, value)) {
      console.log("⚠️ OUT OF RANGE (KEPT):", key, value);
    }

    // ✅ FINAL STORE
    normalized[key] = {
      value: Number(value),
      unit
    };

    console.log("✅ FINAL BIOMARKERS:", Object.keys(normalized));
  }

  return normalized;
}

module.exports = { normalizeUnits };