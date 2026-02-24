import express from "express";
import protect from "../middleware/auth.middleware.js";
import authorize from "../middleware/role.middleware.js";
import {
  createPaymentOrder,
  verifyPayment,
} from "../controllers/payment.controller.js";

const router = express.Router();

router.post(
  "/create-order",
  protect,
  authorize("customer"),
  createPaymentOrder
);

router.post(
  "/verify",
  protect,
  authorize("customer"),
  verifyPayment
);

export default router;
