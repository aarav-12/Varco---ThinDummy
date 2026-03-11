/* eslint-disable no-undef */
require("dotenv").config();

const app = require("./app");

const PORT = process.env.PORT || 5000;
const listEndpoints = require("express-list-endpoints");
console.log(listEndpoints(app));
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

console.log("🚀 CLEAN SERVER STARTED");
