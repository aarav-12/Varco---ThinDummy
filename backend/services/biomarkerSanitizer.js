// services/biomarkerSanitizer.js

function normalizeUnits(biomarkers) {

  const normalized = {};

  for (const key in biomarkers) {

    let { value, unit } = biomarkers[key];

    if (!value) continue;

    const cleanUnit = unit?.toLowerCase().replace(/\s/g, "");
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");

    console.log("CHECK:", key, value, unit);


    // 🧠 HEMOGLOBIN

    if (cleanKey === "hemoglobin") {

      if (cleanUnit === "mg/dl") {
        console.log(" Converting Hemoglobin mg/dL → g/dL");
        value = value / 100;
        unit = "g/dL";
      }

      // Fix AI inflated values
      if (value > 30) {
        console.log(" Fixing Hemoglobin scale:", value);
        value = value / 10;
      }
    }

   
    // GLUCOSE (mmol/L → mg/dL)
   
    if (cleanKey.includes("glucose")) {

      if (cleanUnit === "mmol/l") {
        console.log("⚠️ Converting Glucose mmol/L → mg/dL");
        value = value * 18;
        unit = "mg/dL";
      }
    }

   
    // CHOLESTEROL (mmol/L → mg/dL)
   
    if (
      cleanKey.includes("cholesterol") ||
      cleanKey === "ldl" ||
      cleanKey === "hdl" ||
      cleanKey.includes("triglycerides")
    ) {

      if (cleanUnit === "mmol/l") {
        console.log(" Converting Lipids mmol/L → mg/dL");
        value = value * 38.67;
        unit = "mg/dL";
      }
    }

   
    //  CREATININE (µmol/L → mg/dL)
   
    if (cleanKey === "creatinine") {

      if (cleanUnit === "µmol/l" || cleanUnit === "umol/l") {
        console.log("⚠️ Converting Creatinine µmol/L → mg/dL");
        value = value / 88.4;
        unit = "mg/dL";
      }
    }

   
    // 🌞 Vitamin D (nmol/L → ng/mL)
   
    if (cleanKey === "vitamind") {

      if (cleanUnit === "nmol/l") {
        console.log("⚠️ Converting Vitamin D nmol/L → ng/mL");
        value = value / 2.5;
        unit = "ng/mL";
      }
    }

   
    // 🧠 DEFAULT PASS

    normalized[key] = {
      value: Number(value),
      unit
    };
  }

  return normalized;
}

module.exports = { normalizeUnits };