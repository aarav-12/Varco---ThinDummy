const express = require("express");
const router = express.Router();
const {
  connectGoogleCalendar,
  googleCallback,
  bookConsultation,
} = require("../controllers/calendarController");

console.log("calendarRoutes file loaded");

router.get("/auth/google", connectGoogleCalendar);

router.get("/auth/google/callback", googleCallback);

router.post("/book-consultation", bookConsultation);

module.exports = router;