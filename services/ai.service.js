/* eslint-disable no-undef */
/* eslint-disable no-undef */

const riskMessages = {
  high: "High pain detected. Recommend consultation.",
  moderate: "Moderate symptoms. Monitor and exercise.",
  low: "Low risk. Continue preventive care."
};

const generateExplanation = async (riskLevel) => {
  try {
    console.log("Incoming riskLevel:", riskLevel);

    // Normalize safely
    const normalized = riskLevel?.toLowerCase().trim() || "";

    console.log("Normalized riskLevel:", normalized);

    // Lookup message
    const message = riskMessages[normalized];

    // Return mapped message or safe fallback
    return message || "Unable to determine risk. Please consult a doctor.";

  } catch (error) {
    console.error("AI Service Error:", error);
    return "An error occurred while generating the explanation.";
  }
};

module.exports = {
  generateExplanation
};
