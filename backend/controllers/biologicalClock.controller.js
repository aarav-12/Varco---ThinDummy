const {
  calculateZScores,
  applyDirectionality,
  calculateDomainScores,
  calculateCompositeScore,
  calculateBiologicalAge,
  calculateConfidence
} = require("../services/biologicalClock.service");

const biomarkerReference = require("../db/biomarkerReference");
const domainWeights = require("../db/domainWeights");


// -----------------------------------------
// BIOLOGICAL AGE CONTROLLER
// -----------------------------------------

const calculateBiologicalAgeController = (req, res) => {

  try {

    // -----------------------------
    // Input Validation
    // -----------------------------

    if (!req.body || !req.body.biomarkers || !req.body.age) {
      return res.status(400).json({
        error: "Missing biomarkers or age in request body"
      });
    }

    const { biomarkers, age } = req.body;

    const reference = biomarkerReference;


    // -----------------------------
    // ALGORITHM PIPELINE
    // -----------------------------

    const zScores = calculateZScores(biomarkers, reference);

    const severity = applyDirectionality(zScores, reference);

    const domainScores = calculateDomainScores(severity, reference);

    const compositeScore = calculateCompositeScore(domainScores, domainWeights);

    const ageResult = calculateBiologicalAge(compositeScore, age);

    const confidence = calculateConfidence(biomarkers, reference);


    // -----------------------------
    // RESPONSE
    // -----------------------------
console.log("Z SCORES:", zScores);
console.log("SEVERITY:", severity);
console.log("DOMAIN SCORES:", domainScores);
console.log("COMPOSITE SCORE:", compositeScore);
    res.json({

      input: {
        age,
        biomarkers
      },

      results: {

        zScores,

        severity,

        domainScores,

        compositeScore,

        deltaAge: ageResult.deltaAge,

        biologicalAge: ageResult.biologicalAge,

        confidence

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


// -----------------------------------------
// EXPORT
// -----------------------------------------

module.exports = {
  calculateBiologicalAgeController
};