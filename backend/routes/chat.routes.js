/* eslint-disable no-undef */
const express = require("express");
const router = express.Router();
console.log("📡 chat.routes loaded");

const chatController = require("../controllers/chat.controller");

// 🔹 Triage AI chat
router.post("/triage", chatController.chatWithAI);

// 🔹 Store chat message
router.post("/message", chatController.sendMessage);

// 🔹 Get chat history
router.get("/history/:patientId", chatController.getMessages);

router.get("/test", (req, res) => {
  res.send("Triaged route exists");
});

module.exports = router;
