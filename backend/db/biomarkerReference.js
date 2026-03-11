const biomarkerReference = {

  CRP: {
    mean: 1.5,
    sd: 1.5,
    direction: "high_worse",
    domain: "inflammation",
    unit: "mg/L"
  },

  IL6: {
    mean: 3.5,
    sd: 3.5,
    direction: "high_worse",
    domain: "inflammation",
    unit: "pg/mL"
  },

  VitaminD: {
    mean: 65,
    sd: 35,
    direction: "low_worse",
    domain: "endocrine",
    unit: "ng/mL"
  },

  PTH: {
    mean: 40,
    sd: 20,
    direction: "high_worse",
    domain: "endocrine",
    unit: "pg/mL"
  },

  PINP: {
    mean: 50,
    sd: 20,
    direction: "high_worse",
    domain: "bone",
    unit: "ng/mL"
  },

  CTXII: {
    mean: 300,
    sd: 100,
    direction: "high_worse",
    domain: "bone",
    unit: "ng/mL"
  },

  Osteocalcin: {
    mean: 20,
    sd: 10,
    direction: "low_worse",
    domain: "bone",
    unit: "ng/mL"
  },

  CKMM: {
    mean: 120,
    sd: 40,
    direction: "high_worse",
    domain: "muscle",
    unit: "U/L"
  },

  AldolaseA: {
    mean: 6,
    sd: 2,
    direction: "high_worse",
    domain: "muscle",
    unit: "U/L"
  },

  MMP9: {
    mean: 400,
    sd: 150,
    direction: "high_worse",
    domain: "muscle",
    unit: "ng/mL"
  },

  MDA: {
    mean: 3,
    sd: 1,
    direction: "high_worse",
    domain: "muscle",
    unit: "µmol/L"
  },

  VEGF: {
    mean: 200,
    sd: 80,
    direction: "low_worse",
    domain: "neurovascular",
    unit: "pg/mL"
  },

  BDNF: {
    mean: 25,
    sd: 10,
    direction: "low_worse",
    domain: "neurovascular",
    unit: "ng/mL"
  }

};

module.exports = biomarkerReference;