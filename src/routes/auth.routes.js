import express from "express";
import {
  register,
  verifyEmail,
  login,
  logout,
} from "../controllers/auth.controller.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/register",authLimiter,register);
router.post("/verify-email",authLimiter, verifyEmail);
router.post("/login",authLimiter,login);
router.post("/logout", logout);

export default router;
