function fallbackExtract(text) {
  if (!text || typeof text !== "string") return {};

  const patterns = {
    CRP: /CRP[:\s]*([\d.]+)/i,
    IL6: /IL[-\s]?6[:\s]*([\d.]+)/i,
    MDA: /MDA[:\s]*([\d.]+)/i,
    VEGF: /VEGF[:\s]*([\d.]+)/i,
    MMP9: /MMP[-\s]?9[:\s]*([\d.]+)/i,
    BDNF: /BDNF[:\s]*([\d.]+)/i,
    TGFb1: /TGF[-\s]?b1[:\s]*([\d.]+)/i,
    SP: /\bSP\b[:\s]*([\d.]+)/i,

    LDL: /LDL[:\s]*([\d.]+)/i,
    HDL: /HDL[:\s]*([\d.]+)/i,
    Triglycerides: /Triglycerides[:\s]*([\d.]+)/i,
    HbA1c: /HbA1c[:\s]*([\d.]+)/i,

    CKMM: /CK[-\s]?MM[:\s]*([\d.]+)/i,
    AldolaseA: /Aldolase[-\s]?A[:\s]*([\d.]+)/i,
    CTXII: /CTX[-\s]?II[:\s]*([\d.]+)/i,

    PTH: /PTH[:\s]*([\d.]+)/i,
    VitaminD: /Vitamin\s?D[:\s]*([\d.]+)/i,
    Osteocalcin: /Osteocalcin[:\s]*([\d.]+)/i,

    Creatinine: /Creatinine[:\s]*([\d.]+)/i,
    BUN: /BUN[:\s]*([\d.]+)/i,
    eGFR: /eGFR[:\s]*([\d.]+)/i
  };

  const result = {};

  for (const key in patterns) {
    try {
      const match = text.match(patterns[key]);

      if (match && match[1]) {
        const value = parseFloat(match[1]);

        if (!isNaN(value) && match[1].trim() !== "") {
          result[key] = {
            value,
            unit: "unknown",
            fallback: true
          };
        }
      }

    } catch (err) {
      console.warn(`⚠️ Regex failed for ${key}`);
    }
  }

  return result;
}

module.exports = { fallbackExtract };