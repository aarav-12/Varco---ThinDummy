require("dotenv").config();
const readline = require("readline");
const { callLLM } = require("./services/llm.service");

// ✅ REALISTIC PATIENT DATA (replace later with API data)
const patientData = {
  age: 25,
  biologicalAge: 30,
  deviation: 5,
  domainScores: {
    inflammation: 7,
    muscle: 5
  },
  biomarkers: {
    CRP: 4.2,
    VitaminD: 18
  }
};

// ✅ BUILD CONTEXT
const buildMedicalContext = (data) => {
  return `
Patient Summary:

- Age: ${data.age}
- Biological Age: ${data.biologicalAge}
- Deviation: ${data.deviation}

Domain Scores:
${JSON.stringify(data.domainScores, null, 2)}

Biomarkers:
${JSON.stringify(data.biomarkers, null, 2)}


Instructions:
- Be concise and structured
- Use bullet points
- Focus only on THIS patient's data
- Avoid generic explanations
- Highlight exact abnormal values
- Give 3 clear actionable steps
- Do NOT diagnose
`;
};

// ✅ START
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let messages = [];

const start = async () => {
  console.log("🤖 Generating AI Report Summary...\n");

  // 🔥 STEP 1 — Generate summary FIRST
  const context = buildMedicalContext(patientData);

  messages = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: context + "\n\nGive a summary, risks, and recommendations."
        }
      ]
    }
  ];

  const summary = await callLLM(messages);

  console.log("📊 AI SUMMARY:\n", summary, "\n");

  // 🧠 Save summary in memory
  messages.push({
    role: "assistant",
    content: [
      {
        type: "text",
        text: summary
      }
    ]
  });

  console.log("💬 You can now chat about your report (type 'exit' to quit)\n");

  // 🔥 STEP 2 — CHAT LOOP
  while (true) {
    const userInput = await new Promise((resolve) =>
      rl.question("You: ", resolve)
    );

    if (userInput.toLowerCase() === "exit") {
      console.log("👋 Goodbye!");
      process.exit(0);
    }

    // add user message
    messages.push({
      role: "user",
      content: [
        {
          type: "text",
          text: userInput
        }
      ]
    });

    // call AI
    const response = await callLLM(messages);

    // save response
    messages.push({
      role: "assistant",
      content: [
        {
          type: "text",
          text: response
        }
      ]
    });

    console.log("\nAI:", response, "\n");
  }
};

start();