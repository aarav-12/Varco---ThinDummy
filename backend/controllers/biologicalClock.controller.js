const {
  calculateZScores,
  applyDirectionality,
  calculateDomainScores,
  calculateCompositeScore,
  calculateBiologicalAge,
  calculateConfidence,
  calculateDomainContributions,
  calculateRiskScore
} = require("../services/biologicalClock.service");

const { normalizeUnits } = require("../services/biomarkerSanitizer");
const { mapBiomarkers } = require("../utils/biomarkerMapper");
const { adaptBiomarkerInput } = require("../utils/biomarkerInputAdapter");
const { generateInsights } = require("../services/insightEngine");

const biomarkerReference = require("../db/biomarkerReference");
const domainWeights = require("../db/domainWeights");

const pool = require("../db");

// BIOLOGICAL AGE CONTROLLER


const calculateBiologicalAgeController = async (req, res) => {

  try {

    console.log("🔥 CONTROLLER HIT");

    if (!req.body || !req.body.biomarkers || !req.body.age) {
      return res.status(400).json({
        error: "Missing biomarkers or age in request body"
      });
    }

    const { biomarkers: rawBiomarkers, age } = req.body;

    const biomarkers = adaptBiomarkerInput(rawBiomarkers);
    const reference = biomarkerReference;

    const mappedBiomarkers = mapBiomarkers(biomarkers);

    const dedupedBiomarkers = {};
    for (const key in mappedBiomarkers) {
      dedupedBiomarkers[key] = mappedBiomarkers[key];
    }

    const normalizedBiomarkers = normalizeUnits(dedupedBiomarkers);

    const flattenedBiomarkers = {};
    for (const key in normalizedBiomarkers) {
      flattenedBiomarkers[key] = normalizedBiomarkers[key].value;
    }

    const biomarkerCount = Object.keys(flattenedBiomarkers).length;

    if (biomarkerCount < 2) {
      return res.status(400).json({
        error: "Not enough biomarkers",
        message: "Minimum 2 biomarkers required"
      });
    }

    
    // CORE ENGINE
    
    const zScores = calculateZScores(flattenedBiomarkers, reference);
    const severity = applyDirectionality(zScores, reference);
    const insights = generateInsights(severity, reference);

    const domainScores = calculateDomainScores(severity, reference);
    const compositeScore = calculateCompositeScore(domainScores, domainWeights);
    const domainContributions = calculateDomainContributions(domainScores, domainWeights);
    const riskScore = calculateRiskScore(compositeScore);

    const ageResult = calculateBiologicalAge(compositeScore, age);
    const confidence = calculateConfidence(flattenedBiomarkers, reference);

    const resultsPayload = {
      zScores,
      severity,
      domainScores,
      domainContributions,
      compositeScore,
      riskScore,
      insights,
      deltaAge: ageResult.deltaAge,
      biologicalAge: ageResult.biologicalAge,
      confidence
    };

   
    // SAVE TO DB (SAFE)
   
    try {
      await pool.query(
        `INSERT INTO reports (user_id, age, biomarkers, results)
         VALUES ($1, $2, $3, $4)`,
        [
          "demo-user",
          age,
          JSON.stringify(normalizedBiomarkers),
          JSON.stringify(resultsPayload)
        ]
      );
    } catch (dbError) {
      console.error("DB SAVE FAILED:", dbError.message);
      // Don't crash API if DB fails
    }

    
    // RESPONSE
    
    res.json({
      input: {
        age,
        biomarkers
      },
      results: resultsPayload
    });

  } catch (error) {

    console.error("BIO CLOCK ERROR:", error);

    res.status(500).json({
      error: "Biological age calculation failed",
      details: error.message
    });

  }

};

module.exports = {
  calculateBiologicalAgeController
};