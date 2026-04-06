// utils/unitConversion.js

// 🔥 normalize ALL units to a standard comparable format
function normalizeUnit(unit) {
  if (!unit) return "";

  return unit
    .toLowerCase()
    .replace(/[µμ]/g, "u")      // µ, μ → u
    .replace(/\s/g, "")         // remove spaces
    .replace("/1.73m2", "")     // eGFR fix
    .replace("per", "/");       // optional normalization
}


// 🔥 conversions (only when truly different scales)
const UNIT_CONVERSIONS = {
  MDA: {
    "ng/ml": (v) => v * 0.0357 // ng/mL → µmol/L
  },
  CKMM: {
    "ng/ml": (v) => v * 0.01
  },
  AldolaseA: {
    "ng/ml": (v) => v * 0.1
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

    const expectedUnitRaw = ref.unit;
    const incomingUnitRaw = unit;

    const expectedUnit = normalizeUnit(expectedUnitRaw);
    const incomingUnit = normalizeUnit(incomingUnitRaw);

    // ✅ SAME UNIT (after normalization)
    if (expectedUnit === incomingUnit) {
      converted[key] = {
        value,
        unit: expectedUnitRaw // keep original formatting
      };
      continue;
    }

    // 🔥 TRY CONVERSION (using normalized keys)
    const converter = UNIT_CONVERSIONS[key]?.[incomingUnit];

    if (converter) {
      const newValue = converter(value);

      conversionLog.push({
        name: key,
        from: incomingUnitRaw,
        to: expectedUnitRaw,
        original: value,
        converted: Number(newValue.toFixed(3))
      });

      converted[key] = {
        value: newValue,
        unit: expectedUnitRaw
      };

    } else {

      // ❌ REJECT ONLY IF TRULY INCOMPATIBLE
      rejected.push({
        name: key,
        reason: `Unsupported unit: ${incomingUnitRaw}, expected: ${expectedUnitRaw}`
      });
    }
  }

  return { converted, conversionLog, rejected };
}

module.exports = { applyUnitConversion };