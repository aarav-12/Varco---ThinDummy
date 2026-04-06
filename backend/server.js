require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 5000;
console.log("API KEY:", process.env.OPENAI_API_KEY ? "Loaded" : "Missing");
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});