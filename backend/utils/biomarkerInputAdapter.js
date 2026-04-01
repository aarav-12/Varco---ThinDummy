function adaptBiomarkerInput(input) {

  // If already object → return as is
  if (!Array.isArray(input)) return input;

  const adapted = {};

  for (const item of input) {

    if (!item.name || item.value == null) continue;

    adapted[item.name] = {
      value: item.value,
      unit: item.unit || ""
    };
  }

  return adapted;
}

module.exports = { adaptBiomarkerInput };