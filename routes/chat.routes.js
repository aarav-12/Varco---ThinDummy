/* eslint-disable no-undef */
const express = require("express");
const router = express.Router();

const chatController = require("../controllers/chat.controller");

router.post("/", chatController.chatWithAI);
router.post("/message", chatController.sendMessage);
router.get("/:patientId", chatController.getMessages);
module.exports = router;