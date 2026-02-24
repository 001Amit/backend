import Product from "../models/Product.js";
import Order from "../models/Order.js";

/* ================= SELLER STATS ================= */
export const getSellerStats = async (req, res) => {
  const sellerId = req.user._id;

  const products = await Product.countDocuments({ seller: sellerId });
  const orders = await Order.find({ "items.seller": sellerId });

  let totalEarnings = 0;

  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (
        item.seller.toString() === sellerId.toString() &&
        item.status === "DELIVERED"
      ) {
        if (item.paymentMethod === "COD") {
          totalEarnings += item.sellerPayout;
        }

        if (
          item.paymentMethod === "ONLINE" &&
          item.adminSettlementStatus === "SETTLED"
        ) {
          totalEarnings += item.sellerPayout;
        }
      }
    });
  });

  res.json({
    success: true,
    stats: {
      products,
      orders: orders.length,
      earnings: totalEarnings,
    },
  });
};


/* ================= SELLER ORDERS ================= */
export const getSellerOrders = async (req, res) => {
  const sellerId = req.user._id;

  const orders = await Order.find({ "items.seller": sellerId })
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.json({ success: true, orders });
};

/* ================= UPDATE SELLER ITEM STATUS ================= */
export const updateSellerOrderStatus = async (req, res) => {
  const { orderId, itemId, status } = req.body;

  const order = await Order.findById(orderId);
  if (!order)
    return res.status(404).json({ message: "Order not found" });

  const item = order.items.id(itemId);
  if (!item)
    return res.status(404).json({ message: "Item not found" });

  if (item.seller.toString() !== req.user._id.toString())
    return res.status(403).json({ message: "Unauthorized" });

  // ✅ ALWAYS calculate payout when marking DELIVERED
  if (status === "DELIVERED") {
    const revenue = item.price * item.quantity;

    if (item.paymentMethod === "COD") {
      item.commissionAmount = 0;
      item.sellerPayout = revenue;
      item.adminSettlementStatus = null;
    }

    if (item.paymentMethod === "ONLINE") {
      const commissionRate = 0.1;
      item.commissionAmount = revenue * commissionRate;
      item.sellerPayout = revenue - item.commissionAmount;
      item.adminSettlementStatus = "PENDING";
    }
  }

  item.status = status;
  await order.save();

  res.json({ success: true });
};


/* ======================================================
   SELLER EARNINGS REPORT (DETAILED)
====================================================== */
export const getSellerEarnings = async (req, res) => {
  try {
    const sellerId = req.user._id;

    const orders = await Order.find({ "items.seller": sellerId });

    let codPending = 0;
    let codSettled = 0;
    let onlinePending = 0;
    let onlineSettled = 0;
    let totalItemsSold = 0;

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (
          item.seller.toString() === sellerId.toString() &&
          item.status === "DELIVERED"
        ) {
          totalItemsSold += item.quantity;

          const revenue = item.price * item.quantity;

          // Safe payout calculation
          const payout =
            item.sellerPayout && item.sellerPayout > 0
              ? item.sellerPayout
              : revenue * (1 - (item.commissionRate || 0.1));

          // COD Logic
          if (item.paymentMethod === "COD") {
            if (item.adminSettlementStatus === "SETTLED") {
              codSettled += payout;
            } else {
              codPending += payout;
            }
          }

          // ONLINE Logic
          if (item.paymentMethod === "ONLINE") {
            if (item.adminSettlementStatus === "SETTLED") {
              onlineSettled += payout;
            } else {
              onlinePending += payout;
            }
          }
        }
      });
    });

    const totalEarnings =
      codSettled + onlineSettled + codPending + onlinePending;

    res.json({
      success: true,
      codPending,
      codSettled,
      onlinePending,
      onlineSettled,
      totalItemsSold,
      totalEarnings,
    });
  } catch (error) {
    console.error("SELLER EARNINGS ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
