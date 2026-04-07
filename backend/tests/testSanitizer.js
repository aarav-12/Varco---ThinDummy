const { normalizeUnits } = require("../services/biomarkerSanitizer");

const testInput = {
  BDNF: { value: 0.8, unit: "ng/mL" },     // previously rejected
  MMP9: { value: 4.0, unit: "ng/mL" },     // previously rejected
  CRP: { value: 1.0, unit: "mg/L" },       // normal
  MDA: { value: 32, unit: "ng/mL" }        // conversion case
};

const result = normalizeUnits(testInput);

console.log(JSON.stringify(result, null, 2));