const aliasMap = {

  Hemoglobin: ["hemoglobin", "hb", "hgb"],
  CRP: ["crp", "hscrp", "creactiveprotein"],
  VitaminD: ["vitamind", "vit d", "vitamin d"],

  LDL: ["ldl", "ldlcholesterol"],
  HDL: ["hdl", "hdlcholesterol"],
  FastingGlucose: ["glucose", "fastingglucose", "fasting sugar"],
Creatinine: ["creatinine", "serumcreatinine"],

};

function normalizeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function mapBiomarkers(inputBiomarkers) {
  const mapped = {};

  for (const key in inputBiomarkers) {
    const clean = normalizeName(key);

    let found = null;

    for (const canonical in aliasMap) {
      const aliases = aliasMap[canonical].map(a =>
        a.toLowerCase().replace(/[^a-z0-9]/g, "")
      );

      if (aliases.includes(clean)) {
        found = canonical;
        break;
      }
    }

    if (found) {
      mapped[found] = inputBiomarkers[key];
    } else {
      console.log("⚠️ UNKNOWN BIOMARKER:", key);
    }
  }

  return mapped;
}

module.exports = { mapBiomarkers };