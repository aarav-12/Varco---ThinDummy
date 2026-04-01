// utils/biomarkerInputAdapter.js

function normalizeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function adaptBiomarkerInput(input) {

  // If already object → return as is
  if (!Array.isArray(input)) return input;

  const adapted = {};
  const seen = {};

  for (const item of input) {

    if (!item.name || item.value == null) continue;

    const clean = normalizeName(item.name);

    // store latest occurrence
    seen[clean] = {
      originalName: item.name,
      value: item.value,
      unit: item.unit || ""
    };
  }

  // rebuild final object (last wins)
  for (const key in seen) {
    const entry = seen[key];

    adapted[entry.originalName] = {
      value: entry.value,
      unit: entry.unit
    };
  }

  return adapted;
}

module.exports = { adaptBiomarkerInput };