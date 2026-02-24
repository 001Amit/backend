import express from "express";
import protect from "../middleware/auth.middleware.js";
import authorize from "../middleware/role.middleware.js";
import {
  createCoupon,
  applyCoupon,
} from "../controllers/coupon.controller.js";

const router = express.Router();

/* Admin / Seller */
router.post("/", protect, authorize("admin", "seller"), createCoupon);

/* Customer */
router.post("/apply", protect, authorize("customer"), applyCoupon);

export default router;
