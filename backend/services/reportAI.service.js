/* eslint-disable no-undef */
console.log("📊 reportAI.service loaded");

const generateReport = ({
  biologicalAge,
  chronologicalAge,
  deviation,
  biomarkers,
  severity
}) => {

  const biomarkerBreakdown = Object.keys(biomarkers).map(key => ({
    name: key,
    score: biomarkers[key],
    severity: severity[key]
  }));

  let summary;

  if (deviation >= 3) {
    summary = `Biological age is elevated by ${deviation} years, indicating significant biomarker stress.`;
  } else if (deviation >= 1) {
    summary = `Biological age is slightly elevated by ${deviation} year(s). Moderate imbalance detected.`;
  } else {
    summary = `Biological age aligns with chronological age. Biomarkers are stable.`;
  }

  const recommendations = [];

  if (deviation >= 3) {
    recommendations.push("Consult a medical professional.");
    recommendations.push("Adopt corrective lifestyle interventions.");
  } else if (deviation >= 1) {
    recommendations.push("Improve sleep and physical activity.");
    recommendations.push("Monitor biomarkers regularly.");
  } else {
    recommendations.push("Maintain current lifestyle habits.");
  }

  return {
    summary,
    biomarkerBreakdown,
    recommendations
  };
};

module.exports = {
  generateReport
};
