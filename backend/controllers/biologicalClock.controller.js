const {
  calculateZScores,
  applyDirectionality,
  calculateDomainScores,
  calculateCompositeScore,
  calculateBiologicalAge
} = require("../services/biologicalClock.service");


const calculateBiologicalAgeController = (req, res) => {

  try {

    if (!req.body || !req.body.biomarkers || !req.body.age) {
  return res.status(400).json({
    error: "Missing biomarkers or age in request body"
  });
}

const { biomarkers, age } = req.body;

    // Reference Data (later move to DB)
    const reference = {
      CRP: { mean: 1.5, sd: 1.5, direction: "high_worse", domain: "inflammation" },
      IL6: { mean: 3.5, sd: 3.5, direction: "high_worse", domain: "inflammation" },
      VitaminD: { mean: 65, sd: 35, direction: "low_worse", domain: "endocrine" }
    };

    const domainWeights = {
      inflammation: 0.2,
      endocrine: 0.3
    };

    // Pipeline
    const zScores = calculateZScores(biomarkers, reference);

    const severity = applyDirectionality(zScores, reference);

    const domainScores = calculateDomainScores(severity, reference);

    const compositeScore = calculateCompositeScore(domainScores, domainWeights);

    const ageResult = calculateBiologicalAge(compositeScore, age);

    res.json({
      biomarkers,
      zScores,
      severity,
      domainScores,
      compositeScore,
      deltaAge: ageResult.deltaAge,
      biologicalAge: ageResult.biologicalAge
    });

  } catch (error) {

  console.error("BIO CLOCK ERROR:", error);

  res.status(500).json({
    error: "Biological age calculation failed",
    details: error.message
  });

}
};

module.exports = { calculateBiologicalAgeController };