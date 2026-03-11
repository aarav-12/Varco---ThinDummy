const {
  calculateZScores,
  applyDirectionality,
  calculateDomainScores,
  calculateCompositeScore,
  calculateBiologicalAge
} = require("./backend/services/biologicalClock.service");


// Patient Data
const patient = {
  CRP: 4.2,
  IL6: 8,
  VitaminD: 18
};

const patientAge = 60;


// Reference Data
const reference = {
  CRP: {
    mean: 1.5,
    sd: 1.5,
    direction: "high_worse",
    domain: "inflammation"
  },

  IL6: {
    mean: 3.5,
    sd: 3.5,
    direction: "high_worse",
    domain: "inflammation"
  },

  VitaminD: {
    mean: 65,
    sd: 35,
    direction: "low_worse",
    domain: "endocrine"
  }
};


// Domain Weights
const domainWeights = {
  inflammation: 0.2,
  endocrine: 0.3
};


// Step 1
const zScores = calculateZScores(patient, reference);

// Step 2
const severity = applyDirectionality(zScores, reference);

// Step 3
const domainScores = calculateDomainScores(severity, reference);

// Step 4
const compositeScore = calculateCompositeScore(domainScores, domainWeights);

// Step 5
const ageResult = calculateBiologicalAge(compositeScore, patientAge);


// Output
console.log("\nPatient Biomarkers:");
console.log(patient);

console.log("\nZ Scores:");
console.log(zScores);

console.log("\nSeverity Scores:");
console.log(severity);

console.log("\nDomain Scores:");
console.log(domainScores);

console.log("\nComposite Severity Score:");
console.log(compositeScore);

console.log("\nΔAge:");
console.log(ageResult.deltaAge);

console.log("\nBiological Age:");
console.log(ageResult.biologicalAge);