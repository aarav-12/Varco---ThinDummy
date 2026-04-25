const biomarkerReference = {

  // 🔥 IRF — Inflammation & Repair
  CRP: { mean: 1.5, sd: 1.5, direction: "high_worse", domain: "IRF", unit: "mg/L" },
  IL6: { mean: 3.5, sd: 3.5, direction: "high_worse", domain: "IRF", unit: "pg/mL" },
  MDA: { mean: 3, sd: 1, direction: "high_worse", domain: "IRF", unit: "µmol/L" },
  MMP9: { mean: 400, sd: 150, direction: "high_worse", domain: "IRF", unit: "ng/mL" },

  // 🫀 VAF — Arterio-Vascular
  TotalCholesterol: { mean: 190, sd: 30, direction: "high_worse", domain: "VAF", unit: "mg/dL" },
  NonHDL: { mean: 130, sd: 30, direction: "high_worse", domain: "VAF", unit: "mg/dL" },
  LDL: { mean: 100, sd: 30, direction: "high_worse", domain: "VAF", unit: "mg/dL" },
  HDL: { mean: 55, sd: 15, direction: "low_worse", domain: "VAF", unit: "mg/dL" },
  Triglycerides: { mean: 130, sd: 40, direction: "high_worse", domain: "VAF", unit: "mg/dL" },
  VLDL: { mean: 20, sd: 10, direction: "high_worse", domain: "VAF", unit: "mg/dL" },
  VEGF: { mean: 200, sd: 80, direction: "low_worse", domain: "VAF", unit: "pg/mL" },

  // 🦴 BMF — Bone Metabolism
  Calcium: { mean: 9.5, sd: 0.5, direction: "low_worse", domain: "BMF", unit: "mg/dL" },
  VitaminD: { mean: 65, sd: 35, direction: "low_worse", domain: "BMF", unit: "ng/mL" },
  PTH: { mean: 40, sd: 20, direction: "high_worse", domain: "BMF", unit: "pg/mL" },
  Osteocalcin: { mean: 20, sd: 10, direction: "low_worse", domain: "BMF", unit: "ng/mL" },
  Phosphorus: { mean: 3.5, sd: 0.8, direction: "high_worse", domain: "BMF", unit: "mg/dL" },
  CTXII: { mean: 0.3, sd: 0.15, direction: "high_worse", domain: "BMF", unit: "ng/mL" },

  // ⚗️ CMF — Cellular & Metabolic
  HbA1c: { mean: 5.4, sd: 0.5, direction: "high_worse", domain: "CMF", unit: "%" },
  FastingGlucose: { mean: 90, sd: 15, direction: "high_worse", domain: "CMF", unit: "mg/dL" },
  FastingInsulin: { mean: 10, sd: 7, direction: "high_worse", domain: "CMF", unit: "µIU/mL" },
  TSH: { mean: 2.5, sd: 1.5, direction: "high_worse", domain: "CMF", unit: "mIU/L" },
  T3: { mean: 3.2, sd: 0.8, direction: "low_worse", domain: "CMF", unit: "pg/mL" },
  T4: { mean: 1.2, sd: 0.3, direction: "low_worse", domain: "CMF", unit: "ng/dL" },

  // 💪 MHF — Musculoskeletal Health
  CKMM: { mean: 120, sd: 40, direction: "high_worse", domain: "MHF", unit: "U/L" },
  AldolaseA: { mean: 6, sd: 2, direction: "high_worse", domain: "MHF", unit: "U/L" },
  COMP: { mean: 10, sd: 5, direction: "high_worse", domain: "MHF", unit: "U/L" },
  Hemoglobin: { mean: 14.5, sd: 2, direction: "low_worse", domain: "MHF", unit: "g/dL" },
  RBC: { mean: 4.8, sd: 0.6, direction: "low_worse", domain: "MHF", unit: "10^6/uL" },

  // 🧠 PNF — Peripheral Neuro
  BDNF: { mean: 25, sd: 10, direction: "low_worse", domain: "PNF", unit: "ng/mL" },
  B12: { mean: 600, sd: 150, direction: "low_worse", domain: "PNF" },
  SP: { mean: 200, sd: 80, direction: "low_worse", domain: "PNF", unit: "pg/mL" },
  TGFb1: { mean: 10, sd: 5, direction: "high_worse", domain: "VAF", unit: "ng/mL" },

  // 🧪 RFF — Renal & Fluid Function
  Creatinine: { mean: 0.9, sd: 0.3, direction: "high_worse", domain: "RFF", unit: "mg/dL" },
  eGFR: { mean: 90, sd: 20, direction: "low_worse", domain: "RFF", unit: "mL/min" },
  BUN: { mean: 14, sd: 5, direction: "high_worse", domain: "RFF", unit: "mg/dL" }

};

module.exports = {
  ...biomarkerReference
};