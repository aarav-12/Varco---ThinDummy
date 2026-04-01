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

const biomarkerReference = require("../db/biomarkerReference");
const domainWeights = require("../db/domainWeights");

const { adaptBiomarkerInput } = require("../utils/biomarkerInputAdapter");
// -----------------------------------------
// BIOLOGICAL AGE CONTROLLER
// -----------------------------------------

const calculateBiologicalAgeController = (req, res) => {

  try {

    console.log("🔥 CONTROLLER HIT");

    // -----------------------------
    // Input Validation
    // -----------------------------
    if (!req.body || !req.body.biomarkers || !req.body.age) {
      return res.status(400).json({
        error: "Missing biomarkers or age in request body"
      });
    }

   const { biomarkers: rawBiomarkers, age } = req.body;

// 🔥 NEW: adapt AI or manual input
const biomarkers = adaptBiomarkerInput(rawBiomarkers);
    const reference = biomarkerReference;

    console.log("REFERENCE KEYS:", Object.keys(reference));

    // -----------------------------
    // STEP 1: Alias Mapping
    // -----------------------------
    const mappedBiomarkers = mapBiomarkers(biomarkers);
//techncally this is deduplicate after mapping
    const dedupedBiomarkers = {};

for (const key in mappedBiomarkers) {
  dedupedBiomarkers[key] = mappedBiomarkers[key]; // last wins automatically
}
    // -----------------------------
    // STEP 2: Unit Normalization
    // -----------------------------
    const normalizedBiomarkers = normalizeUnits(dedupedBiomarkers);

    // -----------------------------
    // STEP 3: Flatten Values
    // -----------------------------
    const flattenedBiomarkers = {};

    for (const key in normalizedBiomarkers) {
      flattenedBiomarkers[key] = normalizedBiomarkers[key].value;
    }

    console.log("NORMALIZED:", normalizedBiomarkers);
    console.log("FLATTENED:", flattenedBiomarkers);

    // -----------------------------
    // STEP 4: Minimum Biomarker Check
    // -----------------------------
    const biomarkerCount = Object.keys(flattenedBiomarkers).length;

    if (biomarkerCount < 2) {
      return res.status(400).json({
        error: "Not enough biomarkers to calculate biological age",
        message: "Minimum 2 biomarkers required"
      });
    }

    // -----------------------------
    // STEP 5: Core Algorithm
    // -----------------------------
    const zScores = calculateZScores(flattenedBiomarkers, reference);

    const severity = applyDirectionality(zScores, reference);

    const domainScores = calculateDomainScores(severity, reference);

    const compositeScore = calculateCompositeScore(domainScores, domainWeights);

    // 🔥 NEW ADDITIONS
    const domainContributions = calculateDomainContributions(domainScores, domainWeights);
    const riskScore = calculateRiskScore(compositeScore);

    const ageResult = calculateBiologicalAge(compositeScore, age);

    const confidence = calculateConfidence(flattenedBiomarkers, reference);

    console.log("Z SCORES:", zScores);
    console.log("SEVERITY:", severity);
    console.log("DOMAIN SCORES:", domainScores);
    console.log("COMPOSITE SCORE:", compositeScore);
    console.log("DOMAIN CONTRIBUTIONS:", domainContributions);
    console.log("RISK SCORE:", riskScore);

    // -----------------------------
    // RESPONSE
    // -----------------------------
    res.json({
      input: {
        age,
        biomarkers
      },
      results: {
        zScores,
        severity,
        domainScores,
        domainContributions,   // ✅ NEW
        compositeScore,
        riskScore,             // ✅ NEW
        deltaAge: ageResult.deltaAge,
        biologicalAge: ageResult.biologicalAge,
        confidence
      },
      debug: {
        normalizedBiomarkers,
        flattenedBiomarkers
      }
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