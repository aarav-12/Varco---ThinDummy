// services/insightEngine.js

function getSeverityLabel(value) {
  if (value > 2) return "HIGH";
  if (value > 1) return "MODERATE";
  if (value > 0.5) return "MILD";
  return null;
}

function generateInsights(severity, reference) {

  const insights = [];

  for (const key in severity) {

    const value = severity[key];
    const meta = reference[key];

    if (!meta) continue;

    // Ignore insignificant values
    const level = getSeverityLabel(value);
    if (!level) continue;

    
    // Custom Rules (high signal)
    

    if (key === "LDL") {
      insights.push(`${level} LDL → cardiovascular risk`);
    }

    else if (key === "HDL") {
      insights.push(`${level} HDL → reduced heart protection`);
    }

    else if (key === "FastingGlucose") {
      insights.push(`${level} glucose → insulin resistance risk`);
    }

    else if (key === "Creatinine") {
      insights.push(`${level} creatinine → kidney stress possible`);
    }

    else if (key === "CRP") {
      insights.push(`${level} CRP → inflammation detected`);
    }

    else if (key === "VitaminD") {
      insights.push(`${level} Vitamin D → hormonal / bone risk`);
    }

    
    // Domain-aware fallback (better than generic)
    
    else {
      insights.push(`${level} ${key} → ${meta.domain} imbalance`);
    }
  }
insights.sort((a, b) => {
  const order = { HIGH: 3, MODERATE: 2, MILD: 1 };
  return order[b.split(" ")[0]] - order[a.split(" ")[0]];
});
  return insights;
}

module.exports = { generateInsights };