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
const { adaptBiomarkerInput } = require("../utils/biomarkerInputAdapter");
const { applyUnitConversion } = require("../utils/unitConversion");

const biomarkerReference = require("../db/biomarkerReference");
const domainWeights = require("../db/domainWeights");
const pool = require("../db");


// 🔥 STEP 2 — TOP INSIGHTS FUNCTION
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

    // STEP 1 — ADAPT
    const biomarkers = adaptBiomarkerInput(rawBiomarkers);

    // STEP 2 — MAP
    const { mapped: mappedBiomarkers, rejected: mappingRejected } = mapBiomarkers(biomarkers);

    // STEP 3 — NORMALIZE
    const normalizedBiomarkers = normalizeUnits(mappedBiomarkers);

    // STEP 4 — UNIT CONVERSION
    const {
      converted: unitSafeBiomarkers,
      conversionLog,
      rejected: unitRejected
    } = applyUnitConversion(normalizedBiomarkers, biomarkerReference);

    // STEP 5 — FLATTEN
    const flattenedBiomarkers = {};
    for (const key in unitSafeBiomarkers) {
      flattenedBiomarkers[key] = unitSafeBiomarkers[key].value;
    }

    if (Object.keys(flattenedBiomarkers).length < 2) {
      return res.status(400).json({
        error: "Not enough biomarkers",
        message: "Minimum 2 biomarkers required"
      });
    }

    // STEP 6 — CORE ENGINE
    const zScores = calculateZScores(flattenedBiomarkers, biomarkerReference);
    const severity = applyDirectionality(zScores, biomarkerReference);
    const domainScores = calculateDomainScores(severity, biomarkerReference);

    const compositeScore = calculateCompositeScore(domainScores, domainWeights);
    const ageResult = calculateBiologicalAge(compositeScore, age);
    const confidence = calculateConfidence(flattenedBiomarkers, biomarkerReference);

    // STEP 7 — TRACEABILITY
    const rejected = [
      ...(mappingRejected || []),
      ...(unitRejected || [])
    ];

    // STEP 8 — TRUST LAYER
    const dataPoints = Object.keys(flattenedBiomarkers).length;

    const confidenceLabel =
      confidence > 0.75 ? "High" :
      confidence > 0.5 ? "Moderate" :
      "Low";

    const note =
      dataPoints < 5
        ? "Add more biomarkers for higher accuracy"
        : "Sufficient data for a reliable estimate";

    // STEP 9 — INSIGHTS
    const topIssues = getTopInsights(domainScores);

    // ✅ FINAL RESPONSE
    res.json({
      biologicalAge: ageResult.biologicalAge,
      deltaAge: ageResult.deltaAge,

      matched: Object.keys(flattenedBiomarkers),
      converted: conversionLog,
      rejected,

      domainScores,
      confidence,

      confidenceLabel,
      dataPoints,
      note,

      topIssues,

      algorithmVersion: "2.0"
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
