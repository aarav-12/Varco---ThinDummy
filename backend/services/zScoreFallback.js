function extractZScoreFallback(text) {
  const result = {};

  const patterns = {
    CRP: /CRP.*?(-?\d+(\.\d+)?)/i,
    IL6: /IL[-\s]?6.*?(-?\d+(\.\d+)?)/i,
    LDL: /LDL.*?(-?\d+(\.\d+)?)/i,
    HDL: /HDL.*?(-?\d+(\.\d+)?)/i,
    TG: /TG.*?(-?\d+(\.\d+)?)/i,
    VitaminD: /Vitamin\s*D.*?(-?\d+(\.\d+)?)/i
  };

  for (const key in patterns) {
    const match = text.match(patterns[key]);

    if (match) {
      result[key] = {
        value: parseFloat(match[1]),
        unit: "z-score",
        fallback: true
      };
    }
  }

  return result;
}

module.exports = { extractZScoreFallback };