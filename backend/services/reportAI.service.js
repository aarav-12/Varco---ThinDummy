async function processReport(fullText, age, file) {
  const normalizeAge = (raw) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    const rounded = Math.round(n);
    if (rounded < 1 || rounded > 120) return null;
    return rounded;
  };

  let dobAge = null;
  let frontendAge = null;

  if (typeof age === "number") {
    frontendAge = normalizeAge(age);
  } else if (age && typeof age === "object") {
    dobAge = normalizeAge(age.dobAge);
    frontendAge = normalizeAge(age.frontendAge);
  }

  // 🔥 STEP 1 — EXTRACT
  let rawBiomarkers = [];
  let reportAge = null;
  let ageConfidence = null;

  try {
    const pythonPayload = await extractBiomarkersFromPython(file);

    rawBiomarkers = pythonPayload?.biomarkers || [];
    reportAge = normalizeAge(pythonPayload?.extractedAge);
    ageConfidence = pythonPayload?.ageConfidence || null;

    console.log("✅ USING PYTHON EXTRACTION");
  } catch (err) {
    console.log("⚠️ PYTHON FAILED → FALLBACK LLM");

    rawBiomarkers = await extractBiomarkersFromText(fullText);
  }

  // 🔥 STEP 2 — AGE RESOLUTION
  let ageUsed = null;
  let ageSource = null;

  if (dobAge != null) {
    ageUsed = dobAge;
    ageSource = "dob";
  } else if (frontendAge != null) {
    ageUsed = frontendAge;
    ageSource = "frontend";
  } else if (reportAge != null) {
    ageUsed = reportAge;
    ageSource = "report";
  }

  if (ageUsed == null) {
    throw new Error("No valid age found");
  }

  console.log("🧪 RAW ARRAY:", rawBiomarkers);

  // 🔥 STEP 3 — MERGE (DEDUP RAW)
  const merged = mergeBiomarkers(rawBiomarkers);
  console.log("🧼 MERGED:", merged);

  // ✅ THIS IS WHAT FRONTEND NEEDS
  const rawBiomarkerArray = merged.map(b => ({
    name: b.name,
    value: b.value,
    unit: b.unit
  }));

  // 🔥 STEP 4 — MAP FOR SCORING ONLY
  const inputObject = {};

  for (const b of merged) {
    if (!b?.name || b.value == null) continue;

    inputObject[b.name] = {
      value: b.value,
      unit: b.unit
    };
  }

  const { mapped, rejected } = mapBiomarkers(inputObject);

  console.log("✅ MAPPED COUNT:", Object.keys(mapped).length);
  console.log("❌ REJECTED:", rejected);

  if (!mapped || Object.keys(mapped).length === 0) {
    throw new Error("No valid biomarkers after mapping");
  }

  // 🔥 STEP 5 — SCORING
  const result = calculateBiologicalAge(mapped, ageUsed);

  console.log("📊 DOMAIN SCORES:", result?.domainScores);
  console.log("===== FINAL BIO AGE =====", result?.biologicalAge);

  // 🔥 STEP 6 — RETURN (THIS FIXES EVERYTHING)
  return {
    biologicalAge: result.biologicalAge,
    deltaAge: result.deltaAge,
    compositeScore: result.compositeScore,
    domainScores: result.domainScores,
    severity: result.severity,

    // 🚀 CRITICAL FIX → RAW DATA FOR FRONTEND
    biomarkers: rawBiomarkerArray,

    ageUsed,
    ageSource
  };
}