import express from "express";
import {
  register,
  verifyEmail,
  login,
  logout,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
} from "../controllers/auth.controller.js";
import { authLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

router.post("/register",authLimiter,register);
router.post("/verify-email",authLimiter, verifyEmail);
router.post("/login",authLimiter,login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOTP);
router.post("/reset-password", resetPassword);
export default router;
