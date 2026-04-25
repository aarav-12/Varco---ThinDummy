const { extractTextFromPDF } = require("../services/pdfParser");
// const { extractBiomarkersFromText, mergeBiomarkers } = require("../services/reportAI.service"); // ⚠️ kept
const { processReport } = require("../services/reportAI.service");
const { fallbackExtract } = require("../services/ruleExtractor");
const { runAlgorithm } = require("../services/algorithm.service");
const pool = require("../db");
const biomarkerReference = require("../db/biomarkerReference");

const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const uploadReport = async (req, res) => {
  try {
    console.log("UPLOAD ROUTE HIT");
    console.log("📄 FILE RECEIVED");

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { message: "No file uploaded" },
        data: null
      });
    }

    // 🔹 STEP 1 — Extract text
    const text = await extractTextFromPDF(req.file.buffer);
    console.log("📄 TEXT LENGTH:", text.length);

    // OLD AGE HANDLING (COMMENTED AS REQUESTED — DO NOT REMOVE)
    // const reportAge = Number(req.body.age);
    // if (!Number.isFinite(reportAge)) {
    //   return res.status(400).json({
    //     success: false,
    //     error: { message: "Valid age is required" },
    //     data: null
    //   });
    // }

    // NEW AGE INPUTS (DOB PRIMARY, FRONTEND FALLBACK)
    const normalizeAge = (raw) => {
      const n = Number(raw);
      if (!Number.isFinite(n)) return null;
      const rounded = Math.round(n);
      if (rounded < 1 || rounded > 120) return null;
      return rounded;
    };

    const parseDobToAge = (dobRaw) => {
      if (!dobRaw) return { age: null, error: null };

      const dob = new Date(dobRaw);
      if (Number.isNaN(dob.getTime())) {
        return { age: null, error: "Invalid dob format" };
      }

      const now = new Date();
      if (dob > now) {
        return { age: null, error: "DOB cannot be in the future" };
      }

      let age = now.getFullYear() - dob.getFullYear();
      const monthDiff = now.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
        age -= 1;
      }

      if (age < 1 || age > 120) {
        return { age: null, error: "DOB-derived age must be between 1 and 120" };
      }

      return { age: Math.round(age), error: null };
    };

    const { age: dobAge, error: dobError } = parseDobToAge(req.body.dob);
    if (dobError) {
      return res.status(400).json({
        success: false,
        error: { message: dobError },
        data: null
      });
    }

    const frontendAge = normalizeAge(req.body.age);

    // ✅ NEW PIPELINE (PRIMARY)
    const reportResult = await processReport(
      text,
      { dobAge, frontendAge },
      req.file
    );
    console.log("===== FINAL BIO AGE =====", reportResult?.biologicalAge);
    return res.json(reportResult);

    // LEGACY PATH START (DISABLED)
    // Kept for audit/history as requested. Do not remove.
    // HARD GUARD: if this block is ever reached, fail loudly.
    throw new Error("Legacy upload path must not execute");
    if (false) {

    // 🔧 HELPERS
    function ruleToArray(ruleBiomarkers) {
      return Object.keys(ruleBiomarkers).map(key => ({
        name: key,
        value: ruleBiomarkers[key].value,
        unit: ruleBiomarkers[key].unit
      }));
    }

    // ❌ OLD SANITIZE (COMMENTED — DO NOT REMOVE)
    /*
    function sanitizeBiomarkers({ biomarkers }) {
      if (!Array.isArray(biomarkers)) return [];

      return biomarkers
        .filter(item => item && item.name && item.value !== undefined)
        .map(item => ({
          name: item.name,
          value: Number(item.value),
          unit: item.unit || "unknown"
        }));
    }
    */

    // ✅ NEW SANITIZE (FIXED)
    function sanitizeBiomarkers(rawArray) {
      function normalizeUnit(unit) {
        const clean = String(unit || "")
          .replace(/\s+/g, "")
          .toLowerCase();

        if (clean === "mg/dl") return "mg/dL";
        if (clean === "ng/ml") return "ng/mL";

        return clean;
      }

      const seen = new Set();

      return rawArray
        // remove junk
        .filter(b => {
          if (!b || !b.name) return false;

          if (/^hba$/i.test(b.name.trim())) return false;

          const name = b.name.toLowerCase();

          if (
            name.includes("visit") ||
            name.includes("patient") ||
            name.includes("reference") ||
            name.includes("risk") ||
            name.includes("category") ||
            name.includes("insufficiency") ||
            name.includes("sufficient") ||
            name.includes("prediabetes") ||
            name.includes("doctor") ||
            name.match(/^\d+$/)
          ) {
            return false;
          }

          return true;
        })

        // remove NaN
        .filter(b =>
          typeof b.value === "number" &&
          !isNaN(b.value)
        )

        // normalize names + units
        .map(b => ({
          name: b.name
            .replace(/\s+/g, " ")
            .replace(/\bH\s*D\s*L\b/i, "HDL")
            .replace(/\bL\s*D\s*L\b/i, "LDL")
            .replace(/Human\s*/i, "")
            .replace(/\(.*ELISA.*\)/i, "")
            .trim(),

          value: Number(b.value),

          unit: normalizeUnit(b.unit)
        }))

        // dedupe AFTER cleaning
        .filter(b => {
          const key = b.name.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
    }

    function buildBiomarkerMap(clean) {
      const biomarkerMap = {};
      for (const item of clean) {
        biomarkerMap[item.name] = {
          value: item.value,
          unit: item.unit
        };
      }
      return biomarkerMap;
    }

    // 🔹 STEP 2 — RULE BASED (DO NOT EXECUTE)
    let ruleBiomarkers = null;

    // 🔥 STEP 3 — PYTHON EXTRACTION
    let rawArray = [];

    try {
      const form = new FormData();
      form.append("file", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
      });

      const response = await axios.post(
        process.env.PYTHON_API_URL,
        form,
        {
          headers: form.getHeaders(),
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          timeout: 30000
        }
      );

      const pythonData = response.data;

      if (pythonData?.biomarkers?.length > 0) {
        console.log("✅ USING PYTHON EXTRACTION");
        rawArray = pythonData.biomarkers;
      } else {
        console.log("⚠️ PYTHON EMPTY → USING RULE FALLBACK");
        rawArray = ruleToArray(ruleBiomarkers);
      }

    } catch (err) {
      console.log("⚠️ PYTHON FAILED → USING RULE FALLBACK");
      rawArray = ruleToArray(ruleBiomarkers);
    }

    // ❌ OLD AI BLOCK (COMMENTED — DO NOT REMOVE)
    /*
    try {
      const aiResult = await extractBiomarkersFromText(text);

      if (Array.isArray(aiResult) && aiResult.length > 0) {
        rawArray = aiResult;
      } else {
        rawArray = ruleToArray(ruleBiomarkers);
      }

    } catch (e) {
      rawArray = ruleToArray(ruleBiomarkers);
    }
    */

    console.log("🧪 RAW ARRAY:", rawArray);

    // 🔹 STEP 4 — CLEAN
    const clean = sanitizeBiomarkers(rawArray);
    console.log("🧼 CLEANED:", clean);

    let biomarkers = clean;

    // const normalizeKey = (name) =>
    //   name
    //     .toLowerCase()
    //     .replace(/\(.*?\)/g, "")
    //     .replace(/\*/g, "")
    //     .replace(/\s+/g, "")
    //     .trim();
    //
    // const seen = new Set();
    //
    // biomarkers = biomarkers.filter(b => {
    //   const key = normalizeKey(b.name);
    //   if (seen.has(key)) return false;
    //   seen.add(key);
    //   return true;
    // });

    const normalizeKey = (name) =>
      name
        .toLowerCase()
        .replace(/\(.*?\)/g, "")
        .replace(/\*/g, "")
        .replace(/\s+/g, "")
        .trim();

    // OLD DEDUPE (COMMENTED AS REQUESTED — DO NOT REMOVE)
    // const seen = new Set();
    //
    // biomarkers = biomarkers.filter(b => {
    //   if (!b || !b.name) return false;
    //
    //   const key = normalizeKey(b.name);
    //
    //   if (seen.has(key)) return false;
    //
    //   seen.add(key);
    //   return true;
    // });

    const deduped = {};

    biomarkers.forEach(b => {
      if (!b || !b.name) return;

      const key = b.name
        .toLowerCase()
        .replace(/\(.*?\)/g, "")
        .replace(/\*/g, "")
        .replace(/\s+/g, "")
        .trim();

      deduped[key] = b;
    });

    biomarkers = Object.values(deduped);

    const map = buildBiomarkerMap(biomarkers);

    console.log("🧠 FINAL MAP:", map);

    // 🔥 REAL COUNT (NOT FAKE COUNT)
    const mappedValidKeys = Object.keys(map).filter(
      k => biomarkerReference[k]
    );
    console.log("REAL BIOMARKER COUNT:", mappedValidKeys.length);

    if (!map || Object.keys(map).length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: "No usable biomarkers found" },
        data: null
      });
    }

    // 🔥 STEP 5 — RUN ALGORITHM
    const age = Number(req.body.age) || 60;

    // OLD FLOW (COMMENTED AS REQUESTED — DO NOT REMOVE)
    // const finalBiomarkers = JSON.parse(JSON.stringify(map));

    const normalizedMap = {};

    Object.keys(map).forEach(name => {
      const key = name
        .toLowerCase()
        .replace(/\(.*?\)/g, "")
        .replace(/[^a-z0-9]/g, "");

      // manual mapping rules
      if (key.includes("aldolase")) normalizedMap["AldolaseA"] = map[name];
      else if (key.includes("neurotrophic")) normalizedMap["BDNF"] = map[name];
      else if (key.includes("ckm")) normalizedMap["CKMM"] = map[name];
      else if (key.includes("creatinekinasemuscle")) normalizedMap["CKMM"] = map[name];
      else if (key.includes("tgf")) normalizedMap["TGFb1"] = map[name];
      else if (key.includes("mda")) normalizedMap["MDA"] = map[name];
      else if (key.includes("substancep")) normalizedMap["SP"] = map[name];
      else if (key.includes("vegf")) normalizedMap["VEGF"] = map[name];
      else if (key.includes("comp")) normalizedMap["COMP"] = map[name];
      else if (key.includes("mmp")) normalizedMap["MMP9"] = map[name];
      else if (key.includes("pth")) normalizedMap["PTH"] = map[name];
      else if (key.includes("interleukin6") || key.includes("il6")) normalizedMap["IL6"] = map[name];
      else if (key.includes("osteocalcin")) normalizedMap["Osteocalcin"] = map[name];
      else if (key.includes("ctx")) normalizedMap["CTXII"] = map[name];
      else if (key.includes("hba1c")) normalizedMap["HbA1c"] = map[name];
      else if (key.includes("glucose")) normalizedMap["FastingGlucose"] = map[name];
      else if (key.includes("calcium")) normalizedMap["Calcium"] = map[name];
      else if (key.includes("bun") || key.includes("bloodureanitrogen")) normalizedMap["BUN"] = map[name];
      // OLD LIPID RULES (COMMENTED AS REQUESTED — DO NOT REMOVE)
      // else if (key.includes("cholesterol") && key.includes("total")) normalizedMap["TotalCholesterol"] = map[name];
      // else if (key.includes("triglyceride")) normalizedMap["Triglycerides"] = map[name];
      // else if (key.includes("hdl")) normalizedMap["HDL"] = map[name];
      // else if (key.includes("ldl")) normalizedMap["LDL"] = map[name];
      // else if (key.includes("vldl")) normalizedMap["VLDL"] = map[name];
      else {
        const nameLower = name.toLowerCase().replace(/\s+/g, "");

        if (/nonhdl/.test(nameLower)) {
          normalizedMap["NonHDL"] = map[name];
        }
        else if (/^vldl$/.test(nameLower)) {
          normalizedMap["VLDL"] = map[name];
        }
        else if (/ldlcholesterol/.test(nameLower) || /^ldl$/.test(nameLower)) {
          normalizedMap["LDL"] = map[name];
        }
        else if (/hdlcholesterol/.test(nameLower) || /^hdl$/.test(nameLower)) {
          normalizedMap["HDL"] = map[name];
        }
        else if (/cholesterol/.test(nameLower) && !/hdl|ldl|vldl|nonhdl/.test(nameLower)) {
          normalizedMap["TotalCholesterol"] = map[name];
        }
        else if (key.includes("triglyceride")) normalizedMap["Triglycerides"] = map[name];
        else if (key.includes("crp")) normalizedMap["CRP"] = map[name];
        else if (key.includes("phosphorus")) normalizedMap["Phosphorus"] = map[name];
        else if (key.includes("creatinine")) normalizedMap["Creatinine"] = map[name];
        else if (key.includes("vitamind")) normalizedMap["VitaminD"] = map[name];
      }
    });

    // OLD FLOW (COMMENTED AS REQUESTED — DO NOT REMOVE)
    // const finalBiomarkers = JSON.parse(JSON.stringify(map));

    // 🔴 CLONE (never mutate map)
    const finalBiomarkers = JSON.parse(JSON.stringify(normalizedMap));

    // 🔴 NORMALIZE KEYS
    const normalizeFinalKey = (k) =>
      k.toLowerCase().replace(/\s+/g, "").replace(/_/g, "");

    const keyIndex = {};
    Object.keys(finalBiomarkers).forEach(k => {
      keyIndex[normalizeFinalKey(k)] = k;
    });

    // 🔴 GLUCOSE GUARD
    if (keyIndex["hba1c"]) {
      ["fastingglucose", "averagebloodglucose"].forEach(nk => {
        const original = keyIndex[nk];
        if (original) delete finalBiomarkers[original];
      });
    }

    // 🔴 STRICT FILTER
    const finalStrict = {};
    Object.keys(finalBiomarkers).forEach(k => {
      if (biomarkerReference[k]) {
        finalStrict[k] = finalBiomarkers[k];
      }
    });

    // 🔴 NaN CLEANUP
    Object.keys(finalStrict).forEach(k => {
      const v = finalStrict[k]?.value;
      if (typeof v !== "number" || isNaN(v)) {
        delete finalStrict[k];
      }
    });

    // 🔍 DEBUG (must exist)
    console.log("🚨 FINAL INPUT TO SCORING:", Object.keys(finalStrict));

    const validKeys = Object.keys(finalStrict).filter(
      k => biomarkerReference[k]
    );
    console.log("REAL BIOMARKER COUNT:", validKeys.length);

    // 🔴 SAFETY CHECK
    if (Object.keys(finalStrict).length < 6) {
      return res.status(400).json({
        success: false,
        error: { message: "Insufficient biomarkers" }
      });
    }

    // 🔥 RUN ALGO
    const result = runAlgorithm({
      biomarkers: finalStrict,
      age
    });

    // 🔴 RESPONSE CLEANUP (safe)
    if (finalStrict["HbA1c"] && Array.isArray(result.matched)) {
      result.matched = result.matched.filter(
        k =>
          !/fastingglucose/i.test(k) &&
          !/averagebloodglucose/i.test(k)
      );
    }

    console.log("===== FINAL BIO AGE =====", result.biologicalAge);

    const finalMap = finalStrict;
    const bioAge = result.biologicalAge;
    const delta = result.deltaAge;
    const compositeScore = result.compositeScore;
    const domainScores = result.domainScores;

    // OLD RESPONSE (commented as requested)
    // return res.json({
    //   success: true,
    //   data: result
    // });

    return res.json({
      bioAge,
      chronologicalAge: age,
      delta,
      compositeScore,
      domainScores,

      // RAW BIOMARKERS (from extraction)
      biomarkers: rawArray.map((b) => ({
        name: b.name,
        value: b.value,
        unit: b.unit,
      })),

      // CLEAN / MAPPED BIOMARKERS (used in scoring)
      mappedBiomarkers: Object.entries(finalMap).map(([key, val]) => ({
        name: key,
        value: val.value,
        unit: val.unit,
      })),
    });
    }
    // LEGACY PATH END (DISABLED)

  } catch (err) {
    console.error("UPLOAD ERROR:", err.message);

    return res.status(500).json({
      success: false,
      error: { message: "Failed to process report" },
      data: null
    });
  }
};

module.exports = { uploadReport };