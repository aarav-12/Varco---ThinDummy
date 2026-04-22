// utils/biomarkerMapper.js

// 🔥 MASTER ALIAS MAP (CANONICAL → ALL VARIANTS)
const aliasMap = {

  // 🧪 CORE
  CRP: [
  "crp",
  "hscrp",
  "hs-crp",
  "creactiveprotein",
  "creactiveproteincrp",
  "c reactive protein"
],

  HbA1c: ["hba1c", "hba1c%", "hb a1c", "glycatedhemoglobin"],

  FastingGlucose: [
    "glucose",
    "fastingglucose",
    "fasting blood glucose",
    "fasting sugar",
    "fbs",
    "averagebloodglucose"
  ],

  // 🧬 OXIDATIVE / INFLAMMATION
  MDA: ["mda", "malondialdehyde"],
  IL6: ["il6", "il-6", "interleukin6"],

  // 💪 MUSCLE
  CKMM: [
    "ckmm",
    "ck-mm",
    "ckm",
    "creatinekinasemuscle"
  ],

  AldolaseA: ["aldolase", "aldolasea"],

  // 🫀 LIPIDS
  LDL: ["ldl", "ldlcholesterol"],
  HDL: ["hdl", "hdlcholesterol"],
  Triglycerides: ["triglycerides", "tg"],
  TotalCholesterol: [
    "totalcholesterol",
    "total cholesterol",
    "serumcholesterol"
  ],

  VLDL: ["vldl"],
  NonHDL: ["nonhdlcholesterol", "non hdl cholesterol"],

  // 🧠 GENERAL BLOOD
  Hemoglobin: ["hemoglobin", "hb", "hgb"],
  RBC: ["rbc"],
  WBC: ["wbc"],
  Platelets: ["platelets", "plt"],

  // 🧪 KIDNEY
  Creatinine: ["creatinine", "serumcreatinine"],
  BUN: [
  "bun",
  "bloodureanitrogen",
  "bloodureanitrogenbun",
  "blood urea nitrogen"
],
  eGFR: ["egfr"],

  // 🦴 BONE / HORMONAL
  VitaminD: [
  "vitamind",
  "vitamin d",
  "vit d",
  "25hydroxyvitamind",
  "25 hydroxy vitamin d",
  "25-hydroxy vitamin d"
],
Phosphorus: [
  "phosphorus",
  "seruminorganicphosphorus"
],

  Calcium: ["calcium", "serumcalcium", "s.calcium", "serumtotalcalcium"],

  PTH: ["pth", "ipth", "intactpth"],
  Osteocalcin: ["osteocalcin"],

  // 🧠 NEURO
  BDNF: ["bdnf", "brainderivedneurotrophicfactor"],

  // ⚠️ OPTIONAL
  ESR: ["esr", "erythrocytesedimentationrate"],
  ALT: ["sgpt", "alt"],
  AST: ["sgot", "ast"],
  ALP: ["alp", "alkalinephosphatase"],
  TotalProtein: ["totalprotein"],
  Albumin: ["albumin"],
  Globulin: ["globulin"],

  // 🔥 ADVANCED
  TGFb1: [
    "tgfb1",
    "tgf-b1",
    "transforminggrowthfactorbeta1",
    "transforming growth factor beta 1",
    "tgfβ1",
    "tgf-β1",
    "tgf1"
  ],
  MMP9: ["mmp9", "mmp-9", "matrixmetalloproteinase9"],
  MMP3: ["mmp3", "mmp-3"],
  CTXII: [
  "ctxii",
  "ctx-ii",
  "crosslinkedctelopeptide",
  "crosslinkedctelopeptideoftypeiicollagen"
],
  COMP: [
    "comp",
    "cartilageoligomericmatrixprotein",
    "cartilage oligomeric matrix protein"
  ],

  // 🧪 RATIOS
  CaPRatio: ["capratio", "calciumphosphorusratio"],

  // 🧠 SIGNALING
 VEGF: [
  "vegf",
  "vegfa",
  "vegf-a",
  "vascularendothelialgrowthfactor",
  "vascularendothelialcellgrowthfactora"
],

  // 🧪 SHORT FORMS
  SP: ["sp", "substancep", "substance p"]
};


// 🔧 NORMALIZATION
function extractShortName(name) {
  const match = name.match(/\((.*?)\)/);
  if (match) return match[1];
  return name;
}

function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/_/g, "")
    .replace(/[^a-z0-9]/g, "");
}


// 🔥 MAIN MAPPER
function mapBiomarkers(inputBiomarkers) {
  const mapped = {};
  const rejected = [];

  for (const key in inputBiomarkers) {

    const rawName = extractShortName(key);
    const clean = normalizeName(rawName);
    console.log("🔍 CHECK:", key, "→", clean);

    let found = null;

    // 🔒 HARDCODED PRIORITY MATCHES (CRITICAL FIX)
    if (clean.includes("tgf")) {
      found = "TGFb1";
    }

    if (!found) {
      for (const canonical in aliasMap) {
        const normalizedAliases = aliasMap[canonical].map(a =>
          normalizeName(a)
        );

        // 1. EXACT MATCH FIRST
        if (normalizedAliases.includes(clean)) {
          found = canonical;
          break;
        }
      }
    }

    // 2. ONLY THEN FUZZY MATCH
    if (!found) {
      for (const canonical in aliasMap) {
        const normalizedAliases = aliasMap[canonical].map(a =>
          normalizeName(a)
        );

        if (
          normalizedAliases.some(a => clean.includes(a)) ||
          normalizedAliases.some(a => a.includes(clean))
        ) {
          found = canonical;
          break;
        }
      }
    }

    const biomarker = inputBiomarkers[key];

    if (!found) {
      console.warn("🚨 DROPPED BIOMARKER:", key);

      rejected.push({
        name: key,
        reason: "No mapping found"
      });

      continue;
    }

    // 🔥 STRUCTURE FIX
    if (!biomarker || typeof biomarker !== "object") {
      rejected.push({ name: key, reason: "Invalid structure" });
      continue;
    }

    let value = biomarker.value;
    let unit = biomarker.unit || "unknown";

    value = parseFloat(value);

    if (isNaN(value)) {
      rejected.push({ name: key, reason: "Invalid numeric value" });
      continue;
    }

    // 🔥 UNIT NORMALIZATION
    if (unit.toLowerCase() === "mg/dl") unit = "mg/dL";

    // 🔥 PRIORITY LOGIC (AI > fallback)
    if (!mapped[found]) {
      mapped[found] = { value, unit };
    } else {
      const existing = mapped[found];

      // prefer non-unknown unit
      if (existing.unit === "unknown" && unit !== "unknown") {
        mapped[found] = { value, unit };
      } else {
        console.log(`⚠️ DUPLICATE IGNORED: ${key} → ${found}`);
      }
    }
  }

  return { mapped, rejected };
}

module.exports = { mapBiomarkers, normalizeName };