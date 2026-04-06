// utils/unitConversion.js

const UNIT_CONVERSIONS = {
  MDA: {
    "ng/ml": (v) => v * 0.0357 // ng/mL → µmol/L
  },
  CKMM: {
    "ng/ml": (v) => v * 0.01 // approx
  },
  AldolaseA: {
    "ng/ml": (v) => v * 0.1 // approx placeholder (refine later)
  }
};

function applyUnitConversion(biomarkers, reference) {
  const converted = {};
  const conversionLog = [];
  const rejected = [];

  for (const key in biomarkers) {
    const { value, unit } = biomarkers[key];

    const ref = reference[key];
    if (!ref) continue;

    const expectedUnit = ref.unit?.toLowerCase();
    const incomingUnit = unit?.toLowerCase();

    // ✅ same unit → pass
    if (expectedUnit === incomingUnit) {
      converted[key] = { value, unit };
      continue;
    }

    // 🔥 try conversion
    const converter = UNIT_CONVERSIONS[key]?.[incomingUnit];

    if (converter) {
      const newValue = converter(value);

      conversionLog.push({
        name: key,
        from: unit,
        to: ref.unit,
        original: value,
        converted: Number(newValue.toFixed(2))
      });

      converted[key] = {
        value: newValue,
        unit: ref.unit
      };
    } else {
      // ❌ reject silently wrong units
      rejected.push({
        name: key,
        reason: `Unsupported unit: ${unit}, expected: ${ref.unit}`
      });
    }
  }

  return { converted, conversionLog, rejected };
}

module.exports = { applyUnitConversion };