import express from "express";
import protect from "../middleware/auth.middleware.js";
import authorize from "../middleware/role.middleware.js";
import {
  getSellerStats,
  getSellerOrders,
  updateSellerOrderStatus,
  getSellerEarnings
} from "../controllers/seller.controller.js";

const router = express.Router();

router.get("/stats", protect, authorize("seller"), getSellerStats);
router.get("/orders", protect, authorize("seller"), getSellerOrders);
router.put("/orders/status", protect, authorize("seller"), updateSellerOrderStatus);
router.get("/earnings",protect,authorize("seller"),getSellerEarnings);

export default router;
