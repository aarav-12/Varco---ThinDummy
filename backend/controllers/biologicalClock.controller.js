const {
  calculateZScores,
  applyDirectionality,
  calculateDomainScores,
  calculateCompositeScore,
  calculateBiologicalAge,
  calculateConfidence
} = require("../services/biologicalClock.service");

const { normalizeUnits } = require("../services/biomarkerSanitizer");
const { mapBiomarkers } = require("../utils/biomarkerMapper");
const { buildBiomarkerMap } = require("../utils/biomarkerInputAdapter");
const { applyUnitConversion } = require("../utils/unitConversion");
const DOMAIN_STRUCTURE = require("../constants/domainStructure");

const biomarkerReference = require("../db/biomarkerReference");
const domainWeights = require("../db/domainWeights");
const pool = require("../db");


// 🔥 TOP INSIGHTS
function getTopInsights(domainScores) {
  const entries = Object.entries(domainScores);
  entries.sort((a, b) => b[1] - a[1]);

  const top = entries.slice(0, 2);

  return top.map(([domain, score]) => {
    let impact = "Low";
    if (score > 0.8) impact = "High";
    else if (score > 0.5) impact = "Moderate";

    let message = "";

    if (domain === "endocrine") {
      message = "Blood sugar and metabolic health are your biggest aging drivers";
    } else if (domain === "inflammation") {
      message = "Chronic inflammation is contributing to accelerated aging";
    } else if (domain === "muscle") {
      message = "Muscle health and recovery may be impacting your aging";
    } else {
      message = `${domain} health is contributing to your biological age`;
    }

    return {
      domain,
      score: Number(score.toFixed(2)),
      impact,
      message
    };
  });
}


const calculateBiologicalAgeController = async (req, res) => {
  try {
    console.log("🔥 CONTROLLER HIT");

    if (!req.body || !req.body.biomarkers || !req.body.age || !req.body.patientId) {
      return res.status(400).json({
        error: "Missing biomarkers, age, or patientId"
      });
    }

    const { biomarkers: rawBiomarkers, age, patientId } = req.body;

    // ✅ STEP 1 — ADAPT
    const biomarkersArray = Array.isArray(rawBiomarkers)
      ? rawBiomarkers
      : Object.keys(rawBiomarkers).map(name => ({
          name,
          value: rawBiomarkers[name]?.value,
          unit: rawBiomarkers[name]?.unit
        }));

    const biomarkers = buildBiomarkerMap(biomarkersArray);

    // 🔴 FINAL GUARD — DO NOT MOVE THIS
    if (biomarkers["HbA1c"]) {
      delete biomarkers["FastingGlucose"];
      delete biomarkers["AverageBloodGlucose"];
    }

    // ✅ STEP 2 — MAP
    const { mapped: mappedBiomarkers, rejected: mappingRejected } = mapBiomarkers(biomarkers);

    const validKeys = Object.keys(mappedBiomarkers).filter(
      k => biomarkerReference[k]
    );
    console.log("REAL BIOMARKER COUNT:", validKeys.length);

    if (Object.keys(mappedBiomarkers).length === 0) {
      return res.status(200).json({
        success: false,
        type: "INVALID_REPORT_TYPE",
        message: "This appears to be a processed health report. Please upload a raw lab report with actual biomarker values."
      });
    }

    console.log("📦 FINAL INPUT:", mappedBiomarkers);

    // ✅ STEP 4 — NORMALIZE
    const normalizedBiomarkers = normalizeUnits(mappedBiomarkers);

    // ✅ STEP 5 — UNIT CONVERSION
    const {
      converted: unitSafeBiomarkers,
      conversionLog,
      rejected: unitRejected
    } = applyUnitConversion(normalizedBiomarkers, biomarkerReference);

    // ✅ STEP 6 — FLATTEN
    const flattenedBiomarkers = {};
    for (const key in unitSafeBiomarkers) {
      flattenedBiomarkers[key] = unitSafeBiomarkers[key].value;
    }

    const count = Object.keys(flattenedBiomarkers).length;

    let confidenceLabel = "Low";
    let note = "Limited data, results may not be accurate";

    if (count >= 10) {
      confidenceLabel = "High";
      note = "High confidence estimate";
    } else if (count >= 5) {
      confidenceLabel = "Medium";
      note = "Moderate confidence estimate";
    } else if (count >= 2) {
      confidenceLabel = "Low";
      note = "Very limited data, low accuracy";
    } else {
      return res.status(200).json({
        success: false,
        type: "INSUFFICIENT_DATA",
        message: "At least 2 biomarkers required"
      });
    }

    // 🔥 STEP 7 — SOURCE WEIGHTING (CRITICAL FIX)
    const weightedBiomarkers = {};

    for (const key in unitSafeBiomarkers) {
      const biomarker = unitSafeBiomarkers[key];

      let weight = 1;

      if (biomarker.inferred) {
        weight = 0.6;
      }

      if (biomarker.warnings) {
        weight *= 0.8;
      }

      weightedBiomarkers[key] = flattenedBiomarkers[key] * weight;
    }

    // 🔥 LOW DATA WARNING
    if (Object.keys(flattenedBiomarkers).length < 5) {
      console.log("⚠️ Low data mode");
    }

    // ✅ STEP 8 — CORE ENGINE
    const zScores = calculateZScores(weightedBiomarkers, biomarkerReference);
    const severity = applyDirectionality(zScores, biomarkerReference);
    const domainScores = calculateDomainScores(severity, biomarkerReference);

    const compositeScore = calculateCompositeScore(domainScores, domainWeights);
    const ageResult = calculateBiologicalAge(compositeScore, age);
    const confidence = calculateConfidence(flattenedBiomarkers, biomarkerReference);

    // ✅ STEP 9 — TRACEABILITY
    const rejected = [
      ...(mappingRejected || []),
      ...(unitRejected || [])
    ];

    const topIssues = getTopInsights(domainScores);

    // ✅ FINAL RESPONSE
    const result = {
      biologicalAge: ageResult.biologicalAge,
      deltaAge: ageResult.deltaAge,

      matched: Object.keys(flattenedBiomarkers),
      converted: conversionLog,
      rejected,

      domainScores,
      confidence,

      topIssues,

      algorithmVersion: "3.0"
    };

    {
      const { patientId } = req.body;

      if (patientId) {
        try {
          await pool.query(
            `UPDATE patients
             SET biological_age = $1,
                 delta_age = $2,
                 domain_scores = $3,
                 domain_contributions = $4,
                 updated_at = $5
             WHERE id = $6`,
            [
              result.biologicalAge,
              result.deltaAge,
              JSON.stringify(result.domainScores || {}),
              JSON.stringify(result.domainContributions || {}),
              new Date(),
              patientId
            ]
          );

          console.log("✅ FINAL RESULT SAVED:", patientId);

        } catch (err) {
          console.error("❌ Failed to save final result:", err.message);
        }
      }
    }

    result.confidenceLabel = confidenceLabel;
    result.note = note;
    result.dataPoints = count;
    result.source = "pdf_upload";

    const biomarkersByDomain = {};

    for (const domain in DOMAIN_STRUCTURE) {
      biomarkersByDomain[domain] = [];

      DOMAIN_STRUCTURE[domain].forEach((biomarker) => {
        if (result.matched.includes(biomarker)) {
          biomarkersByDomain[domain].push(biomarker);
        }
      });
    }

    res.json({
      ...result,
      biomarkersByDomain
    });

    // ✅ NON-BLOCKING DB SAVE
    try {
      await pool.query(
        `INSERT INTO reports (user_id, age, biomarkers, results)
         VALUES ($1, $2, $3, $4)`,
        [
          patientId,
          age,
          JSON.stringify(unitSafeBiomarkers),
          JSON.stringify({
            biologicalAge: ageResult.biologicalAge,
            deltaAge: ageResult.deltaAge,
            domainScores,
            confidence
          })
        ]
      );
    } catch (dbError) {
      console.error("DB ERROR (non-blocking):", dbError.message);
    }

  } catch (error) {
    console.error("BIO CLOCK ERROR:", error);

    return res.status(500).json({
      error: "Biological age calculation failed",
      details: error.message
    });
  }
};

module.exports = {
  calculateBiologicalAgeController
};