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
const { generateAllRecommendations } = require("../services/recommendationEngine.service");

const biomarkerReference = require("../db/biomarkerReference");
const domainWeights = require("../db/domainWeights");

const { callLLM } = require("../services/llm.service"); // 🔥 AI

const pool = require("../db");


// AI CONTEXT BUILDER
const buildMedicalContext = (data) => {
  return `
Patient Summary:

- Age: ${data.age}
- Biological Age: ${data.biologicalAge}
- Deviation: ${data.deltaAge}

Domain Scores:
${JSON.stringify(data.domainScores, null, 2)}

Biomarkers:
${JSON.stringify(data.biomarkers, null, 2)}

Instructions:
- Be concise and structured
- Use bullet points
- Focus only on THIS patient's data
- Highlight abnormal values
- Give 3 actionable steps
- Do NOT diagnose
`;
};


// CONTROLLER

const calculateBiologicalAgeController = async (req, res) => {
  try {
    console.log("🔥 CONTROLLER HIT");

    if (!req.body || !req.body.biomarkers || !req.body.age || !req.body.patientId) {
      return res.status(400).json({
        error: "Missing biomarkers, age, or patientId"
      });
    }

    const { biomarkers: rawBiomarkers, age, patientId } = req.body;

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

  
    // AI SUMMARY
  

    let aiSummary = null;

    try {
      const context = buildMedicalContext({
        age,
        biologicalAge: ageResult.biologicalAge,
        deltaAge: ageResult.deltaAge,
        domainScores,
        biomarkers: flattenedBiomarkers
      });

      const messages = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: context + "\n\nGive summary, risks, and recommendations."
            }
          ]
        }
      ];

      aiSummary = await callLLM(messages);

    } catch (aiError) {
      console.error("AI SUMMARY FAILED:", aiError.message);
      aiSummary = "AI summary unavailable";
    }

  
    // RECOMMENDATIONS
  

    const recommendations = generateAllRecommendations(domainScores);

    try {
      for (const rec of recommendations) {
        await pool.query(
          `INSERT INTO patient_recommendations (patient_id, domain, recommendation)
           VALUES ($1, $2, $3)
           ON CONFLICT (patient_id, domain) DO NOTHING`,
          [patientId, rec.domain, rec.recommendation]
        );
      }
    } catch (recError) {
      console.error("RECOMMENDATION SAVE FAILED:", recError.message);
    }

  
    // SAVE REPORT
  

    try {
      await pool.query(
        `INSERT INTO reports (user_id, age, biomarkers, results, ai_summary)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          patientId,
          age,
          JSON.stringify(normalizedBiomarkers),
          JSON.stringify(resultsPayload),
          aiSummary
        ]
      );
    } catch (dbError) {
      console.error("DB SAVE FAILED:", dbError.message);
    }

  
    // RESPONSE
  

    res.json({
      input: {
        age,
        biomarkers
      },
      results: resultsPayload,
      recommendations,
      aiSummary // 🔥 AI OUTPUT
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