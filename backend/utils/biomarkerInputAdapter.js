const { normalizeName } = require("./biomarkerMapper");
const { normalizeUnit } = require("./unitConversion");
const biomarkerReference = require("../db/biomarkerReference");

function buildBiomarkerMap(array) {
  const map = {};
  const deduped = {};

  array.forEach(b => {
    if (!b || !b.name) return;

    const dedupeKey = normalizeName(b.name);
    if (!dedupeKey) return;

    deduped[dedupeKey] = b;
  });

  Object.values(deduped).forEach(b => {
    const name = normalizeName(b.name);

    if (!name) return;

    // ✅ THIS LINE IS THE FIX
    let { value, unit } = normalizeUnit(
      name,
      b.value,
      b.unit
    );

    if (name.toLowerCase().includes("aldolase")) {
      console.log("📥 RAW FROM LLM:", name, value, unit);

      console.log("📥 FINAL PARSED:", name, value, unit);

      if (value < 10) {
        console.log("🚨 SCALE ERROR DETECTED:", value);
      }
    }

    // no more "detected" units
    if (unit === "detected") {
      unit = biomarkerReference[name]?.unit || "unknown";
    }

    // 🚨 SANITY FILTERS
    if ((name === "LDL" || name === "ldl") && value < 30) {
      console.log("⚠️ Rejecting invalid LDL:", value);
      return; // skip wrong LDL
    }

    if (isNaN(value)) return;

    map[name] = { value, unit };
  });

  return map;
}

module.exports = { buildBiomarkerMap };