/* eslint-disable no-undef */
// services/scoring.service.js

function calculateRisk(painLevel) {

    console.log("🔍 Raw painLevel received:", painLevel);
  // Step 1: Validate input
  if (painLevel === undefined || painLevel === null) {
     console.error("❌ Pain level missing");
    throw new Error("Pain level is required");
  }

  const pain = Number(painLevel);
 console.log("🔢 Converted painLevel to number:", pain);
  
  // agar string aaya ya NaN aaya toh fail karo
  if (isNaN(pain)) {
    console.error("❌ Pain level is not a number");
    throw new Error("Pain level must be a number");
  }

  // unrealistic values block karo
  if (pain < 0 || pain > 10) {
    console.error("❌ Pain level out of range");
    throw new Error("Pain level must be between 0 and 10");
  }

  // Step 2: Risk Logic (highest first)
  if (pain >= 7) {
    console.log("⚠️ Risk level determined: High");
    return "High"; // 7–10
  }

  if (pain >= 4) {
    console.log("⚠️ Risk level determined: Moderate");
    return "Moderate"; // 4–6
  }

  console.log("✅ Risk level determined: Low");
  return "Low"; // 0–3
}

module.exports = { calculateRisk };
