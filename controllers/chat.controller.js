/* eslint-disable no-undef */
exports.getChatResponse = (req, res) => {
  res.json({
    explanation: "This is a demo AI response",
    riskLevel: "Moderate",
  });
};
