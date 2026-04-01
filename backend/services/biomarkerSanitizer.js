// services/biomarkerSanitizer.js

function normalizeUnits(biomarkers) {
  const normalized = {};

  for (const key in biomarkers) {

    let { value, unit } = biomarkers[key];

    if (value === undefined || value === null) continue;

    const cleanUnit = unit?.toLowerCase().replace(/\s/g, "");
    const cleanKey = key.toLowerCase().replace(/\s/g, "");

    console.log("CHECK:", key, cleanKey, value, unit);

    
    // HEMOGLOBIN FIXES
    
    if (cleanKey === "hemoglobin") {

      // Case 1: Wrong unit (mg/dL → g/dL)
      if (cleanUnit === "mg/dl") {
        console.log("⚠️ FIXING UNIT (mg/dL → g/dL):", value);
        value = value / 100;
        unit = "g/dL";
      }

      // Case 2: Inflated value (140 instead of 14)
      else if (value > 30) {
        console.log("⚠️ FIXING SCALE (÷10):", value);
        value = value / 10;
        unit = "g/dL";
      }

      // Case 3: Too low → probably double-converted
      if (value < 5) {
        console.log("⚠️ LOW VALUE DETECTED, correcting scale:", value);
        value = value * 10;
      }
    }

    
    // GENERIC GUARD (optional but powerful)
    
    if (typeof value !== "number" || isNaN(value)) {
      console.log("❌ INVALID VALUE, skipping:", key);
      continue;
    }

    normalized[key] = { value, unit };
  }

  return normalized;
}


// EXPORT

module.exports = {
  normalizeUnits
};