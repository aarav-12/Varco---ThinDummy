const express = require("express");
const router = express.Router();

const {
  bookConsultation,
} = require("../controllers/calendarController");

console.log("calendarRoutes file loaded");

// main booking route
router.post("/book-consultation", bookConsultation);

module.exports = router;