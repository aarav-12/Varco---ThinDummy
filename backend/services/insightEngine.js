// services/insightEngine.js

function generateInsights(severity, reference) {

  const insights = [];

  for (const key in severity) {

    const value = severity[key];
    const meta = reference[key];

    if (!meta) continue;

    // 🔥 Only flag meaningful deviations
    if (value < 0.5) continue;

    
    // Custom Rules (high signal)
    

    if (key === "LDL" && value >= 1) {
      insights.push("High LDL → increased cardiovascular risk");
    }

    else if (key === "HDL" && value >= 1) {
      insights.push("Low HDL → reduced heart protection");
    }

    else if (key === "FastingGlucose" && value >= 0.5) {
      insights.push("Elevated glucose → risk of insulin resistance");
    }

    else if (key === "Creatinine" && value >= 0.5) {
      insights.push("Elevated creatinine → possible kidney stress");
    }

    else if (key === "CRP" && value >= 0.5) {
      insights.push("Elevated CRP → inflammation detected");
    }

    else if (key === "VitaminD" && value >= 1) {
      insights.push("Low Vitamin D → hormonal / bone health risk");
    }

    
    // Generic fallback
    
    else {
      insights.push(`${key} is outside optimal range`);
    }
  }

  return insights;
}

module.exports = { generateInsights };