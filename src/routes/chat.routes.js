import express from "express";
import protect from "../middleware/auth.middleware.js";
import { getChatHistory } from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/:userId", protect, getChatHistory);

export default router;
