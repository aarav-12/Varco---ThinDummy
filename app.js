/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require("express");
const cors = require("cors");

const patientRoutes = require("./routes/patient.routes");
const chatRoutes = require("./routes/chat.routes");
const doctorRoutes = require("./routes/doctor.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/patient", patientRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/doctor", doctorRoutes);

app.get("/", (req, res) => {
  res.json({ status: "Backend running" });
});

module.exports = app;

