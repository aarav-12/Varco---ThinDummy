// services/biomarkerSanitizer.js

function normalizeUnits(biomarkers) {
  const normalized = {};

  // 🔥 SANITY BOUNDS (realistic clinical ranges)
  const SANITY_BOUNDS = {
    BDNF: { min: 5, max: 100 },        // ng/mL
    MMP9: { min: 50, max: 2000 },      // ng/mL
    CTXII: { min: 0.05, max: 2.0 },    // ng/mL
    MDA: { min: 0.1, max: 20 },        // µmol/L
    CRP: { min: 0.01, max: 50 },
  };

  function normalizeUnit(unit) {
    if (!unit) return "";

    return unit
      .toLowerCase()
      .replace(/[µμ]/g, "u")       // normalize micro
      .replace(/\s/g, "")          // remove spaces
      .replace(/\/1\.73m2$/, "");  // remove eGFR suffix
  }

  function isPlausible(key, value) {
    const bounds = SANITY_BOUNDS[key];
    if (!bounds) return true;

    if (value < bounds.min || value > bounds.max) {
      console.log("🚨 REJECTED (implausible):", key, value);
      return false;
    }

    return true;
  }

  for (const key in biomarkers) {
    let { value, unit } = biomarkers[key];

    if (value == null) continue;

    let cleanUnit = normalizeUnit(unit);
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");

    console.log("CHECK:", key, value, unit);

    
    // 🧠 HEMOGLOBIN
    
    if (cleanKey === "hemoglobin") {
      if (cleanUnit === "mg/dl") {
        console.log("⚠️ Hemoglobin mg/dL → g/dL");
        value = value / 100;
        unit = "g/dL";
      }

      if (value > 30) {
        console.log("⚠️ Fix Hemoglobin scale");
        value = value / 10;
      }
    }

    
    // 🍬 GLUCOSE
    
    if (cleanKey.includes("glucose")) {
      if (cleanUnit === "mmol/l") {
        console.log("⚠️ Glucose mmol/L → mg/dL");
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
        console.log("⚠️ Lipids mmol/L → mg/dL");
        value = value * 38.67;
        unit = "mg/dL";
      }
    }

    
    // 🧪 CREATININE
    
    if (cleanKey === "creatinine") {
      if (cleanUnit === "umol/l") {
        console.log("⚠️ Creatinine µmol/L → mg/dL");
        value = value / 88.4;
        unit = "mg/dL";
      }
    }

    
    // 🌞 VITAMIN D
    
    if (cleanKey === "vitamind") {
      if (cleanUnit === "nmol/l") {
        console.log("⚠️ Vitamin D nmol/L → ng/mL");
        value = value / 2.5;
        unit = "ng/mL";
      }
    }

    
    // 🔥 CRITICAL PARSER FIXES
    

    // CKMM wrong unit
    if (cleanKey === "ckmm" && cleanUnit === "ng/ml") {
      console.log("🚑 Fix CKMM → U/L");
      unit = "U/L";
      value = value * 10;
    }

    // Aldolase wrong unit
    if (cleanKey === "aldolasea" && cleanUnit === "ng/ml") {
      console.log("🚑 Fix Aldolase → U/L");
      unit = "U/L";
      value = value / 5;
    }

    // MDA conversion
    if (cleanKey === "mda" && cleanUnit === "ng/ml") {
      console.log("🚑 MDA → µmol/L");
      value = value / 28.97;
      unit = "µmol/L";
    }

    
    // 🔥 SPECIAL CASE FIXES
    

    // eGFR fix (unit normalization only)
    if (cleanKey === "egfr") {
      unit = "mL/min"; // standardize
    }

    // BDNF fix
    if (cleanKey === "bdnf") {
      if (value < 1) {
        console.log("⚠️ BDNF suspicious → trying pg→ng");
        value = value * 1000;
      }

      if (!isPlausible("BDNF", value)) continue;
    }

    // MMP9 fix
    if (cleanKey === "mmp9") {
      if (value < 10) {
        console.log("🚨 Reject MMP9 bad scale");
        continue;
      }
    }

    // CTXII fix (assuming ng/mL correct scale)
    if (cleanKey === "ctxii") {
      // no conversion needed if reference fixed
    }

    
    // ❌ BAD UNIT REJECTION
    
    if (
      cleanUnit.includes("x10") ||
      cleanUnit.includes("^")
    ) {
      console.log("🚨 REJECTED (invalid unit):", key, unit);
      continue;
    }

    
    // ❌ FINAL SANITY CHECK
    
    if (!isPlausible(key, value)) continue;

    
    // ✅ FINAL STORE
    
    normalized[key] = {
      value: Number(value),
      unit
    };
  }

  return normalized;
}

module.exports = { normalizeUnits };