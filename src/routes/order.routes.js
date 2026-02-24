import express from "express";
import {
  placeOrder,
  getMyOrders,
  getSellerOrders,
  updateSellerOrderStatus,
  cancelSellerItem,
  confirmOnlinePayment,
  cancelPendingOrder,
  cancelCustomerItem,
} from "../controllers/order.controller.js";

import{
   orderLimiter,
   paymentLimiter,
}from "../middleware/rateLimiter.js"
import protect from "../middleware/auth.middleware.js";
import authorize from "../middleware/role.middleware.js";

import validate from "../middleware/validate.middleware.js";
import { placeOrderSchema } from "../validations/order.validation.js";

const router = express.Router();

/* ======================================================
   CUSTOMER ROUTES
====================================================== */

// Place order (COD or ONLINE)
router.post(
  "/",
  protect,
  authorize("customer"),
  orderLimiter,
  validate(placeOrderSchema),
  placeOrder
);

// My orders
router.get(
  "/my",
  protect,
  authorize("customer"),
  getMyOrders
);

// Customer cancels a specific item
router.post(
  "/cancel-item",
  protect,
  authorize("customer"),
  cancelCustomerItem
);

// Online payment success confirmation
router.post(
  "/confirm-payment",
  protect,
  authorize("customer"),
  paymentLimiter,
  confirmOnlinePayment
);

// Online payment cancelled (Razorpay dismiss)
router.post(
  "/:id/cancel",
  protect,
  authorize("customer"),
  cancelPendingOrder
);

/* ======================================================
   SELLER ROUTES
====================================================== */

// Seller sees their orders
router.get(
  "/seller",
  protect,
  authorize("seller"),
  getSellerOrders
);

// Seller updates item status
router.put(
  "/seller/item-status",
  protect,
  authorize("seller"),
  updateSellerOrderStatus
);

// Seller cancels item
router.put(
  "/seller/cancel-item",
  protect,
  authorize("seller"),
  cancelSellerItem
);

/* ======================================================
   ADMIN / GLOBAL
====================================================== */



export default router;
