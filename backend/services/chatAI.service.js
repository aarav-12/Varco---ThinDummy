/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

console.log("🤖 chatAI.service loaded");

const generateChatResponse = async ({
  painLevel,
  riskLevel,
  symptoms,
  prompt
}) => {
  try {
    console.log("💬 Chat AI executing triage mode");

    // Simple deterministic logic for now

    if (riskLevel === "High") {
      return `Based on a pain level of ${painLevel}${symptoms ? ` and symptoms of ${symptoms}` : ""}, this falls into a high-risk category. Immediate medical consultation is recommended.`;
    }

    if (riskLevel === "Moderate") {
      return `With a pain level of ${painLevel}${symptoms ? ` and symptoms of ${symptoms}` : ""}, this is considered a moderate concern. Monitor symptoms and avoid strain.`;
    }

    return `A pain level of ${painLevel}${symptoms ? ` with ${symptoms}` : ""} suggests a low-risk situation. Rest and observation are advised.`;

  } catch (error) {
    console.error("Chat AI Error:", error);
    return "Unable to generate explanation at this time.";
  }
};

module.exports = {
  generateChatResponse
};
