require("dotenv").config();

const express = require("express");
const app = require("./app");

const listEndpoints = require("express-list-endpoints");

// ROUTES
const biologicalClockRoutes = require("./routes/biologicalClock.routes");
const reportRoutes = require("./routes/report.routes");
const patientRoutes = require("./routes/patient.routes"); // ✅ FIXED

// MIDDLEWARE
app.use(express.json());

// ROUTE MOUNTING
app.use("/api/biological-age", biologicalClockRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", require("./routes/admin.routes"));
app.use("/api/patient", patientRoutes); // ✅ THIS WAS MISSING

// DEBUG: list all endpoints
console.log(listEndpoints(app));

// OPTIONAL: health check (very useful)
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// START SERVER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});