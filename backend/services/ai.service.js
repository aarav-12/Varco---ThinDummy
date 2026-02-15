/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

const generateExplanation = async ({ deviation, severity }) => {
  try {
    const entries = Object.entries(severity || {});
    const counts = entries.reduce(
      (acc, [, level]) => {
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      },
      { Mild: 0, Moderate: 0, Severe: 0 }
    );

    const overall =
      counts.Severe > 0
        ? "Severe"
        : counts.Moderate > 0
          ? "Moderate"
          : "Mild";

    const dev = Number(deviation);
    const devText =
      Number.isFinite(dev) && dev !== 0
        ? `Biological age is ${Math.abs(dev)} year${Math.abs(dev) === 1 ? "" : "s"} ${dev > 0 ? "higher" : "lower"} than chronological age.`
        : "Biological age matches chronological age.";

    return `Overall biomarker severity is ${overall}. ${devText}`;
  } catch (error) {
    console.error("AI Explanation Error:", error);
    return "Unable to generate explanation at this time.";
  }
};

module.exports = {
  generateExplanation
};
