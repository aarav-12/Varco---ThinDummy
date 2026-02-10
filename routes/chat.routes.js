/* eslint-disable no-undef */
const express = require("express");
const router = express.Router();

const chatController = require("../controllers/chat.controller");

router.post("/", chatController.getChatResponse);

module.exports = router;
