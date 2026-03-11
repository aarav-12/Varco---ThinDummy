/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

const express = require("express");
const cors = require("cors");
const app = express();

const patientRoutes = require("./routes/patient.routes");
const chatRoutes = require("./routes/chat.routes");
const doctorRoutes = require("./routes/doctor.routes");
const calendarRoutes = require("./routes/calendarRoutes");
const biologicalClockRoutes = require("./routes/biologicalClock.routes");
console.log("Calendar routes loaded");
app.use(cors());
app.use(express.json());
app.use("/api/biological-age", biologicalClockRoutes);
console.log("Mounting calendar routes...");

app.use("/api/patient", patientRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/doctor", doctorRoutes);


app.use("/api/calendar", calendarRoutes);

/* LOGGER */
app.use((req, res, next) => {
  console.log("➡ Incoming request:", req.method, req.originalUrl);
  next();
});

/* ROOT */
app.get("/", (req, res) => {
  res.json({ status: "Backend running" });
});
app.get("/api/test", (req, res) => {
  res.send("API working");
});
module.exports = app;