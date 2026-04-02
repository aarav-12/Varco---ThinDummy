const generateRecommendation = (domain, score) => {
  if (score <= 2) {
    return `${domain} markers are within optimal range. Maintain your current lifestyle including balanced diet, regular exercise, and proper sleep.`;
  }

  if (score <= 3.5) {
    return `Moderate imbalance detected in ${domain}. Improve diet quality, increase physical activity, and manage stress levels consistently.`;
  }

  return `Elevated risk in ${domain}. Immediate lifestyle intervention is recommended. Consider consulting a healthcare professional for targeted action.`;
};

const generateAllRecommendations = (domainScores) => {
  const recommendations = [];

  for (const domain in domainScores) {
    const score = domainScores[domain];

    recommendations.push({
      domain,
      recommendation: generateRecommendation(domain, score)
    });
  }

  return recommendations;
};

module.exports = {
  generateRecommendation,
  generateAllRecommendations
};