/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

const express = require("express");
const cors = require("cors");

const app = express();

/* ROUTES */
const patientRoutes = require("./routes/patient.routes");
const chatRoutes = require("./routes/chat.routes");
const doctorRoutes = require("./routes/doctor.routes");
const calendarRoutes = require("./routes/calendarRoutes");
const biologicalClockRoutes = require("./routes/biologicalClock.routes");
const recommendationsRoutes = require("./routes/recommendations.routes");
const reportRoutes = require("./routes/report.routes");
const adminRoutes = require("./routes/admin.routes");

/* MIDDLEWARE */
app.use(cors({
  origin: "*", // or your frontend domain later
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "apikey",
    "x-client-info"
  ]
}));
app.options("*", cors());
app.use(express.json());

app.use("/api/report", reportRoutes);
/* LOGGER (put AFTER middleware, BEFORE routes is also fine) */
app.use((req, res, next) => {
  console.log("➡ Incoming request:", req.method, req.originalUrl);
  next();
});

/* ROUTE MOUNTING — SINGLE SOURCE OF TRUTH */
app.use("/api/patient", patientRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/biological-age", biologicalClockRoutes);
app.use("/api/recommendations", recommendationsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);

/* TEST ROUTES */
app.get("/", (req, res) => {
  res.json({ status: "Backend running 🚀" });
});

app.get("/api/test", (req, res) => {
  res.send("API working ✅");
});

module.exports = app;