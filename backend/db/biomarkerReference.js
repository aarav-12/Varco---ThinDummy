const biomarkerReference = {

  // 🔥 INFLAMMATION
  CRP: { mean: 1.5, sd: 1.5, direction: "high_worse", domain: "inflammation", unit: "mg/L" },
  IL6: { mean: 3.5, sd: 3.5, direction: "high_worse", domain: "inflammation", unit: "pg/mL" },
  WBC: { mean: 7.5, sd: 3.5, direction: "high_worse", domain: "inflammation", unit: "x10^3/uL" },
  Platelets: { mean: 250, sd: 75, direction: "high_worse", domain: "inflammation", unit: "x10^3/uL" },
  Creatinine: { mean: 0.9, sd: 0.3, direction: "high_worse", domain: "inflammation", unit: "mg/dL" },
  eGFR: { mean: 90, sd: 20, direction: "low_worse", domain: "inflammation", unit: "mL/min" },
  BUN: { mean: 14, sd: 5, direction: "high_worse", domain: "inflammation", unit: "mg/dL" },

  // ⚗️ ENDOCRINE
  VitaminD: { mean: 65, sd: 35, direction: "low_worse", domain: "endocrine", unit: "ng/mL" },
  PTH: { mean: 40, sd: 20, direction: "high_worse", domain: "endocrine", unit: "pg/mL" },
  TSH: { mean: 2.5, sd: 1.5, direction: "high_worse", domain: "endocrine", unit: "mIU/L" },
  T3: { mean: 3.2, sd: 0.8, direction: "low_worse", domain: "endocrine", unit: "pg/mL" },
  T4: { mean: 1.2, sd: 0.3, direction: "low_worse", domain: "endocrine", unit: "ng/dL" },
  HbA1c: { mean: 5.4, sd: 0.5, direction: "high_worse", domain: "endocrine", unit: "%" },
  FastingGlucose: { mean: 90, sd: 15, direction: "high_worse", domain: "endocrine", unit: "mg/dL" },
  FastingInsulin: { mean: 10, sd: 7, direction: "high_worse", domain: "endocrine", unit: "µIU/mL" },

  // 🦴 BONE
  PINP: { mean: 50, sd: 20, direction: "high_worse", domain: "bone", unit: "ng/mL" },
  CTXII: { mean: 300, sd: 100, direction: "high_worse", domain: "bone", unit: "ng/mL" },
  Osteocalcin: { mean: 20, sd: 10, direction: "low_worse", domain: "bone", unit: "ng/mL" },

  // 💪 MUSCLE
  CKMM: { mean: 120, sd: 40, direction: "high_worse", domain: "muscle", unit: "U/L" },
  AldolaseA: { mean: 6, sd: 2, direction: "high_worse", domain: "muscle", unit: "U/L" },
  MMP9: { mean: 400, sd: 150, direction: "high_worse", domain: "muscle", unit: "ng/mL" },
  MDA: { mean: 3, sd: 1, direction: "high_worse", domain: "muscle", unit: "µmol/L" },
  Hemoglobin: { mean: 14.5, sd: 2, direction: "low_worse", domain: "muscle", unit: "g/dL" },
  RBC: { mean: 4.8, sd: 0.6, direction: "low_worse", domain: "muscle", unit: "x10^6/uL" },

  // 🧠 NEUROVASCULAR
  VEGF: { mean: 200, sd: 80, direction: "low_worse", domain: "neurovascular", unit: "pg/mL" },
  BDNF: { mean: 25, sd: 10, direction: "low_worse", domain: "neurovascular", unit: "ng/mL" },
  TotalCholesterol: { mean: 190, sd: 30, direction: "high_worse", domain: "neurovascular", unit: "mg/dL" },
  LDL: { mean: 100, sd: 30, direction: "high_worse", domain: "neurovascular", unit: "mg/dL" },
  HDL: { mean: 55, sd: 15, direction: "low_worse", domain: "neurovascular", unit: "mg/dL" },
  Triglycerides: { mean: 130, sd: 40, direction: "high_worse", domain: "neurovascular", unit: "mg/dL" }

};

module.exports = biomarkerReference;