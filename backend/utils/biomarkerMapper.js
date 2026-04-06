// utils/biomarkerMapper.js

const aliasMap = {

  // 🧪 CORE
  CRP: ["crp", "hscrp", "hs-crp", "hs crp", "creactiveprotein"],

  HbA1c: ["hba1c", "hba1c%", "hb a1c", "glycatedhemoglobin"],

  FastingGlucose: [
    "glucose",
    "fastingglucose",
    "fasting blood glucose",
    "fasting sugar",
    "fbs"
  ],

  // 🧬 OXIDATIVE / INFLAMMATION
  MDA: ["mda"],
  IL6: ["il6", "il-6"],

  // 💪 MUSCLE
  CKMM: ["ck", "cpk", "cpk(total)", "cpktotal", "creatinekinase"],
  AldolaseA: ["aldolase", "aldolasea"],

  // 🫀 LIPIDS
  LDL: ["ldl", "ldlcholesterol"],
  HDL: ["hdl", "hdlcholesterol"],
  Triglycerides: ["triglycerides", "tg"],

  // 🧠 GENERAL BLOOD
  Hemoglobin: ["hemoglobin", "hb", "hgb"],
  RBC: ["rbc"],
  WBC: ["wbc"],
  Platelets: ["platelets", "plt"],

  // 🧪 KIDNEY
  Creatinine: ["creatinine", "serumcreatinine"],
  BUN: ["bun", "bloodureanitrogen"],
  eGFR: ["egfr"],

  // 🦴 BONE / HORMONAL
  VitaminD: ["vitamind", "vit d", "vitamin d"],
  Calcium: ["calcium", "serumcalcium", "s.calcium"],
  PTH: ["pth"],
  Osteocalcin: ["osteocalcin"],

  // 🧠 NEURO
  BDNF: ["bdnf"],

  // ⚠️ OPTIONAL / FUTURE (won’t break if missing in reference)
  ESR: ["esr", "erythrocytesedimentationrate"],
  ALT: ["sgpt", "alt"],
  AST: ["sgot", "ast"],
  ALP: ["alp", "alkalinephosphatase"],
  TotalProtein: ["totalprotein"],
  Albumin: ["albumin"],
  Globulin: ["globulin"],
  TGFb1: ["tgfb1", "tgf-b1"],
  MMP3: ["mmp3", "mmp-3"]
};

function normalizeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function mapBiomarkers(inputBiomarkers) {
  const mapped = {};
  const rejected = [];

  for (const key in inputBiomarkers) {
    const clean = normalizeName(key);

    let found = null;

    for (const canonical in aliasMap) {
      const aliases = aliasMap[canonical].map(normalizeName);

      if (aliases.includes(clean)) {
        found = canonical;
        break;
      }
    }

    if (found) {
      mapped[found] = inputBiomarkers[key];
    } else {
      rejected.push({
        name: key,
        reason: "No mapping found"
      });
      console.log("⚠️ UNKNOWN BIOMARKER:", key);
    }
  }

  return { mapped, rejected };
}

module.exports = { mapBiomarkers };