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
  TotalCholesterol: ["totalcholesterol", "total cholesterol"],

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

  // ⚠️ OPTIONAL / FUTURE
  ESR: ["esr", "erythrocytesedimentationrate"],
  ALT: ["sgpt", "alt"],
  AST: ["sgot", "ast"],
  ALP: ["alp", "alkalinephosphatase"],
  TotalProtein: ["totalprotein"],
  Albumin: ["albumin"],
  Globulin: ["globulin"],
  TGFb1: ["tgfb1", "tgf-b1"],
  MMP3: ["mmp3", "mmp-3"],

  // 🦴 ADVANCED / EDGE
  CTXII: ["ctxii", "ctx-ii"],
  COMP: ["comp"],

  // 🧪 RATIOS
  CaPRatio: ["capratio", "calciumphosphorusratio"],

  // 🧠 SIGNALING
  VEGF: ["vegf"],

  // 🧪 UNKNOWN SHORT FORMS
  SP: ["sp"]
};


// 🔧 NORMALIZE FUNCTION
function normalizeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}


// 🔥 MAIN MAPPER
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

      const biomarker = inputBiomarkers[key];

      // ✅ VALIDATE STRUCTURE
      if (!biomarker || typeof biomarker.value !== "number" || !biomarker.unit) {
        rejected.push({
          name: key,
          reason: "Invalid structure (missing unit or value)"
        });
        continue;
      }

      // ✅ PREVENT DUPLICATE OVERRIDE
      if (!mapped[found]) {
        mapped[found] = biomarker;
      } else {
        console.log(`⚠️ DUPLICATE BIOMARKER IGNORED: ${key} → ${found}`);
      }

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