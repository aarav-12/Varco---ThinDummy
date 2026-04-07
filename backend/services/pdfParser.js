const pdf = require("pdf-parse");

async function extractTextFromPDF(buffer) {
  try {
    const data = await pdf(buffer);
    return data.text;
  } catch (err) {
    console.error("PDF PARSE ERROR:", err);
    throw new Error("Failed to parse PDF");
  }
}

module.exports = { extractTextFromPDF };