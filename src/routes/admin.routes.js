import express from "express";
import protect from "../middleware/auth.middleware.js";
import authorize from "../middleware/role.middleware.js";
import {
  getAdminStats,
  getRecentOrders,
  getAllUsers,
  toggleBanUser,
  approveSeller,
  deleteUser,
  getSellerOrderSummary,
  getOrdersBySeller,
  getAllOrdersAdmin,
  getRevenueBySeller,
  getMonthlyRevenue,
  getSellerSettlementSummary,
  settleSellerItem,
  getPendingItemSettlements,
  getSettlementHistory,

  
} from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/stats", protect, authorize("admin"), getAdminStats);
router.get("/orders/recent", protect, authorize("admin"), getRecentOrders);
router.get("/users", protect, authorize("admin"), getAllUsers);
router.put("/ban/:id", protect, authorize("admin"), toggleBanUser);
router.put("/approve/:id", protect, authorize("admin"), approveSeller);
router.delete("/users/:id", protect, authorize("admin"), deleteUser);
router.get("/seller-orders/:sellerId",protect,authorize("admin"),getOrdersBySeller);
router.get("/seller-orders",protect,authorize("admin"),getSellerOrderSummary);
router.get("/orders",protect,authorize("admin"),getAllOrdersAdmin);
router.get("/revenue/sellers",protect,authorize("admin"),getRevenueBySeller);
router.get("/revenue/monthly",protect,authorize("admin"),getMonthlyRevenue);
router.get("/settlements",protect,authorize("admin"),getSellerSettlementSummary);
router.put("/settlements/settle-item",protect,authorize("admin"),settleSellerItem);
router.get(
  "/settlements/items",
  protect,
  authorize("admin"),
  getPendingItemSettlements
);
router.get(
  "/settlements/history",
  protect,
  authorize("admin"),
  getSettlementHistory
);

export default router;