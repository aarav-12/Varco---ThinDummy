// utils/unitConversion.js

// 🔥 normalize ALL units to a standard comparable format
function normalizeUnit(name, value, unit) {
  const normalizedName = String(name || "").toLowerCase();
  value = Number(value);

  // 🔥 FIX 1 — Aldolase (CRITICAL)
  if ((name === "AldolaseA" || normalizedName === "aldolasea") && unit === "ng/mL") {
    return { value: value * 0.1, unit: "U/L" };
  }

  // 🔥 FIX 2 — CKMM
  if ((name === "CKMM" || normalizedName === "ckmm") && unit === "ng/mL") {
    return { value: value * 10, unit: "U/L" };
  }

  return { value, unit };
}


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

    const normalized = normalizeUnit(key, value, incomingUnitRaw);
    const normalizedValue = normalized.value;
    const normalizedUnitRaw = normalized.unit;

    const expectedUnit = normalizeUnit(key, value, expectedUnitRaw).unit
      ? normalizeUnit(key, value, expectedUnitRaw).unit.toLowerCase().replace(/[µμ]/g, "u").replace(/\s/g, "").replace("/1.73m2", "").replace("per", "/")
      : "";
    const incomingUnit = normalizeUnit(key, normalizedValue, normalizedUnitRaw).unit
      ? normalizeUnit(key, normalizedValue, normalizedUnitRaw).unit.toLowerCase().replace(/[µμ]/g, "u").replace(/\s/g, "").replace("/1.73m2", "").replace("per", "/")
      : "";

    // ✅ SAME UNIT (after normalization)
    if (expectedUnit === incomingUnit) {
      converted[key] = {
        value: normalizedValue,
        unit: expectedUnitRaw // keep original formatting
      };
      continue;
    }

    // 🔥 TRY CONVERSION (using normalized keys)
    if (normalizedUnitRaw !== incomingUnitRaw) {
      conversionLog.push({
        name: key,
        from: incomingUnitRaw,
        to: normalizedUnitRaw,
        original: value,
        converted: Number(normalizedValue.toFixed(3))
      });

      converted[key] = {
        value: normalizedValue,
        unit: normalizedUnitRaw
      };

      continue;
    }

    // ❌ REJECT ONLY IF TRULY INCOMPATIBLE
    rejected.push({
      name: key,
      reason: `Unsupported unit: ${incomingUnitRaw}, expected: ${expectedUnitRaw}`
    });
  }

  return { converted, conversionLog, rejected };
}

module.exports = { applyUnitConversion, normalizeUnit };