// services/biomarkerSanitizer.js

function normalizeUnits(biomarkers) {
  const normalized = {};

  // 🔥 VALID RANGES (sanity filter)
  const ranges = {
    MDA: { min: 0, max: 20 },
    CKMM: { min: 10, max: 300 },
    AldolaseA: { min: 1, max: 25 },
    HbA1c: { min: 3, max: 15 },
    CRP: { min: 0, max: 50 },
    VitaminD: { min: 5, max: 150 },
    LDL: { min: 20, max: 300 },
    HDL: { min: 10, max: 100 },
    Triglycerides: { min: 30, max: 500 },
    Creatinine: { min: 0.3, max: 5 },
    eGFR: { min: 10, max: 200 }
  };

  function isValid(key, value) {
    const range = ranges[key];
    if (!range) return true;

    if (value < range.min || value > range.max) {
      console.log("🚨 REJECTED (out of range):", key, value);
      return false;
    }
    return true;
  }

  for (const key in biomarkers) {
    let { value, unit } = biomarkers[key];

    if (value == null) continue;

    let cleanUnit = unit?.toLowerCase().replace(/\s/g, "");
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");

    console.log("CHECK:", key, value, unit);

    // 🔥 NORMALIZE SYMBOLS
    cleanUnit = cleanUnit
      ?.replace(/μ/g, "u")
      ?.replace(/µ/g, "u");

    
    // 🧠 HEMOGLOBIN
    
    if (cleanKey === "hemoglobin") {
      if (cleanUnit === "mg/dl") {
        console.log("⚠️ Converting Hemoglobin mg/dL → g/dL");
        value = value / 100;
        unit = "g/dL";
      }

      if (value > 30) {
        console.log("⚠️ Fixing Hemoglobin scale:", value);
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

    
    // 🔥 CRITICAL FIXES (PARSER ERRORS)
    

    // ❗ CK-MM wrongly parsed as ng/mL
    if (cleanKey === "ckmm" && cleanUnit === "ng/ml") {
      console.log("🚑 Fixing CKMM unit → U/L");
      unit = "U/L";
      value = value * 10; // heuristic scale fix
    }

    // ❗ Aldolase wrongly parsed as ng/mL
    if (cleanKey === "aldolasea" && cleanUnit === "ng/ml") {
      console.log("🚑 Fixing Aldolase → U/L");
      unit = "U/L";
      value = value / 5; // heuristic correction
    }

    // ❗ MDA conversion (ng/mL → µmol/L)
    if (cleanKey === "mda" && cleanUnit === "ng/ml") {
      console.log("🚑 Converting MDA → µmol/L");
      value = value / 28.97;
      unit = "µmol/L";
    }

    
    // ❌ REJECT BAD UNITS
    
    if (
      cleanUnit?.includes("x10") ||
      cleanUnit?.includes("^")
    ) {
      console.log("🚨 REJECTED (invalid unit):", key, unit);
      continue;
    }

    
    // ❌ FINAL SANITY CHECK
    
    if (!isValid(key, value)) continue;

    
    // ✅ FINAL STORE
    
    normalized[key] = {
      value: Number(value),
      unit
    };
  }

  return normalized;
}

module.exports = { normalizeUnits };