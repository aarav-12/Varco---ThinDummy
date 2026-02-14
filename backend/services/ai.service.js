/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

// const OpenAI = require("openai");

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// // 🔁 Fallback deterministic mapping
// const fallbackMessages = {
//   high: "High pain detected. Recommend consultation with a doctor as soon as possible.",
//   moderate: "The patient is categorized under Moderate risk based on the reported pain level of 4. This indicates a condition that may require monitoring but is not immediately critical. Given the reported symptom of severe back pain, rest and controlled activity are advised. If symptoms intensify or mobility worsens, seek medical evaluation.",
//   low: "Low risk level. Continue preventive care and rest."
// };

// const generateExplanation = async ({ painLevel, riskLevel, symptoms }) => {
//   console.log("🔥 generateExplanation called with:", { painLevel, riskLevel, symptoms });
//   try {
//     const normalized = riskLevel?.toLowerCase().trim() || "";

//     // 🧠 Structured prompt
//     console.log("🚀 Calling OpenAI API...");

//     const prompt = `
// You are a medical triage assistant.

// The patient's risk level has already been calculated by a clinical algorithm.
// Do NOT change or override the provided risk level.

// Patient Data:
// - Pain Level: ${painLevel}
// - Risk Level (pre-computed): ${riskLevel}
// - Symptoms: ${symptoms || "Not specified"}

// Based only on this information:

// 1. Explain what the current risk level means in simple medical terms.
// 2. Provide clear and practical next-step advice.

// Keep the response concise (4–6 lines total).
// Do not speculate beyond the given risk level.
// `;

//     // 🚀 OpenAI Call
//     const response = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [
//         { role: "system", content: "You are a professional medical triage assistant." },
//         { role: "user", content: prompt }
//       ],
//       temperature: 0.2,
//       max_tokens: 200,
//     });

//     return response.choices[0].message.content;

//   } catch (error) {
//     console.error("OpenAI Error — Falling back:", error.message);

//     // 🔁 Fallback if API fails
//     const fallback = fallbackMessages[riskLevel?.toLowerCase()] 
//       || "Unable to determine risk. Please consult a healthcare professional.";
// console.log("API KEY EXISTS:", !!process.env.OPENAI_API_KEY);

//     return fallback;
//   }
// };

// module.exports = {
//   generateExplanation
// };
/* eslint-disable no-undef */

// Conversational explanation builder
const buildExplanation = ({ painLevel, riskLevel, symptoms }) => {
  const symptomText = symptoms ? `and the reported symptom of ${symptoms}` : "";

  if (riskLevel === "High") {
    return `
Based on the pain level of ${painLevel} ${symptomText}, this falls into a high-risk category.

This usually means the body is signaling something significant that shouldn't be ignored.

You should consider consulting a doctor as soon as possible rather than waiting it out.

If the pain worsens, spreads, or limits movement further, seek urgent medical attention.
`.trim();
  }

  if (riskLevel === "Moderate") {
    return `
With a pain level of ${painLevel} ${symptomText}, this is considered a moderate concern.

It may not be an emergency, but your body clearly needs attention and care.

Rest, avoid strain, and monitor how symptoms behave over the next day or two.

If things don’t improve or start getting worse, a medical check-up would be a smart next step.
`.trim();
  }

  return `
A pain level of ${painLevel} ${symptomText} suggests a low-risk situation.

This is commonly manageable with rest and basic self-care.

Stay hydrated, avoid overexertion, and observe the symptoms.

If anything unusual develops or persists, then consider medical advice.
`.trim();
};

const generateExplanation = async ({ painLevel, riskLevel, symptoms }) => {
  try {
    console.log("🧠 Local AI simulation running");
    return buildExplanation({ painLevel, riskLevel, symptoms });
  } catch (error) {
    console.error("Local AI Error:", error);
    return "Unable to generate explanation. Please monitor symptoms and consult a professional if needed.";
  }
};

module.exports = {
  generateExplanation
};
