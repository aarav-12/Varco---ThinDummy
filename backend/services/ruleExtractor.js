function extractBiomarkersRuleBased(text) {
  const patterns = {
    CRP: /CRP[^0-9]*([\d.]+)\s*mg\/?L/i,
    IL6: /IL[-\s]?6[^0-9]*([\d.]+)\s*pg\/?mL/i,
    LDL: /LDL[^0-9]*([\d.]+)\s*mg\/?dL/i,
    HDL: /HDL[^0-9]*([\d.]+)\s*mg\/?dL/i,
    Triglycerides: /Triglycerides[^0-9]*([\d.]+)\s*mg\/?dL/i,
    TotalCholesterol: /Total Cholesterol[^0-9]*([\d.]+)\s*mg\/?dL/i,
    VitaminD: /Vitamin\s*D[^0-9]*([\d.]+)\s*ng\/?mL/i,
    Creatinine: /Creatinine[^0-9]*([\d.]+)\s*mg\/?dL/i,
    BUN: /BUN[^0-9]*([\d.]+)\s*mg\/?dL/i,
    eGFR: /eGFR[^0-9]*([\d.]+)\s*mL/i
  };

  const result = {};

  for (const key in patterns) {
    const match = text.match(patterns[key]);

    if (match) {
      result[key] = {
        value: parseFloat(match[1]),
        unit: "detected"
      };
    }
  }

  return result;
}

module.exports = { extractBiomarkersRuleBased };