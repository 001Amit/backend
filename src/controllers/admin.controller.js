import User from "../models/User.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import mongoose from "mongoose";

/* ======================================================
   ADMIN DASHBOARD STATS
   - Revenue = ONLINE + DELIVERED only
====================================================== */
export const getAdminStats = async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalSellers = await User.countDocuments({ role: "seller" });
  const totalOrders = await Order.countDocuments();


  const orders = await Order.find({
  "items.status": "DELIVERED",
  "items.adminSettlementStatus": "SETTLED",
});

let revenue = 0;

orders.forEach((order) => {
  order.items.forEach((item) => {
    if (
      item.status === "DELIVERED" &&
      item.adminSettlementStatus === "SETTLED"
    ) {
      revenue += item.commissionAmount || 0;
    }
  });
});




  const pendingSellers = await User.find({
    role: "seller",
    isApproved: false,
  });

  res.json({
    success: true,
    stats: {
      totalUsers,
      totalSellers,
      totalOrders,
      revenue,
      pendingSellers,
    },
  });
};

/* ======================================================
   RECENT ORDERS (ADMIN)
====================================================== */
export const getRecentOrders = async (req, res) => {
  const orders = await Order.find()
    .populate("user", "name")
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({ success: true, orders });
};

/* ======================================================
   USERS
====================================================== */
export const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json({ success: true, users });
};

export const toggleBanUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  user.isBanned = !user.isBanned;
  await user.save();
  res.json({ success: true });
};

export const approveSeller = async (req, res) => {
  const user = await User.findById(req.params.id);
  user.isApproved = true;
  await user.save();
  res.json({ success: true });
};

export const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (user.role === "admin") {
    return res
      .status(403)
      .json({ message: "Admins cannot be deleted" });
  }

  if (user._id.toString() === req.user._id.toString()) {
    return res
      .status(403)
      .json({ message: "You cannot delete your own account" });
  }

  if (user.role === "seller") {
    await Product.deleteMany({ seller: user._id });
  }

  await Order.deleteMany({ user: user._id });
  await user.deleteOne();

  res.json({ success: true, message: "User deleted permanently" });
};

/* ======================================================
   SELLER ORDER SUMMARY (ADMIN)
   - ONLINE + DELIVERED only
====================================================== */
export const getSellerOrderSummary = async (req, res) => {
  const summary = await Order.aggregate([
    { $unwind: "$items" },

    // ✅ ONLY COUNT DELIVERED ITEMS
    {
      $match: {
        "items.status": "DELIVERED",
      },
    },

    {
      $group: {
        _id: "$items.seller",

        orderIds: { $addToSet: "$_id" },
        itemsSold: { $sum: "$items.quantity" },

        
        revenue: { $sum: "$items.commissionAmount" }

      },
    },

    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "seller",
      },
    },
    { $unwind: "$seller" },

    {
      $project: {
        sellerId: { $toString: "$seller._id" }, // 🔥 IMPORTANT
        name: "$seller.name",
        email: "$seller.email",
        orders: { $size: "$orderIds" },
        itemsSold: 1,
        revenue: 1,
        _id: 0,
      },
    },

    { $sort: { revenue: -1 } },
  ]);

  res.json({
    success: true,
    sellers: summary,
  });
};

/* ======================================================
   ADMIN → ORDERS BY SELLER
====================================================== */
export const getOrdersBySeller = async (req, res) => {
  const { sellerId } = req.params;

  // ✅ PREVENT 500 ERROR
  if (!mongoose.Types.ObjectId.isValid(sellerId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid seller ID",
    });
  }

  const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

  const orders = await Order.aggregate([
    { $unwind: "$items" },

    {
      $match: {
        "items.seller": sellerObjectId,
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "customer",
      },
    },
    { $unwind: "$customer" },

    {
      $project: {
        orderId: "$_id",
        customerName: "$customer.name",
        customerEmail: "$customer.email",
        productName: "$items.name",
        quantity: "$items.quantity",
        price: "$items.price",
        total: { $multiply: ["$items.price", "$items.quantity"] },
        status: "$items.status",
        createdAt: 1,
      },
    },

    { $sort: { createdAt: -1 } },
  ]);

  res.json({ success: true, orders });
};

/* ======================================================
   ADMIN → ALL ORDERS
====================================================== */
export const getAllOrdersAdmin = async (req, res) => {
  const orders = await Order.find()
    .populate("user", "name email")
    .populate("items.product", "name")
    .populate("items.seller", "name email")
    .sort({ createdAt: -1 });

  res.json({ success: true, orders });
};

/* ======================================================
   ADMIN → REVENUE BY SELLER (SPLIT)
====================================================== */
export const getRevenueBySeller = async (req, res) => {
  const data = await Order.aggregate([
    { $unwind: "$items" },

    {
      $match: {
        "items.status": "DELIVERED",
      },
    },

    {
      $group: {
        _id: "$items.seller",

        onlineRevenue: {
          $sum: {
            $cond: [
              { $eq: ["$items.paymentMethod", "ONLINE"] },
              { $multiply: ["$items.price", "$items.quantity"] },
              0,
            ],
          },
        },

        codRevenue: {
          $sum: {
            $cond: [
              { $eq: ["$items.paymentMethod", "COD"] },
              { $multiply: ["$items.price", "$items.quantity"] },
              0,
            ],
          },
        },

        itemsSold: { $sum: "$items.quantity" },
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "seller",
      },
    },
    { $unwind: "$seller" },

    {
      $project: {
        sellerId: "$seller._id",
        name: "$seller.name",
        email: "$seller.email",
        onlineRevenue: 1,
        codRevenue: 1,
        totalRevenue: {
          $add: ["$onlineRevenue", "$codRevenue"],
        },
        itemsSold: 1,
        _id: 0,
      },
    },

    { $sort: { totalRevenue: -1 } },
  ]);

  res.json({ success: true, sellers: data });
};

/* ======================================================
   ADMIN → MONTHLY REVENUE (ONLINE + DELIVERED)
====================================================== */
export const getMonthlyRevenue = async (req, res) => {
  const revenue = await Order.aggregate([
    { $unwind: "$items" },

    {
      $match: {
        "items.status": "DELIVERED",
        "items.paymentMethod": "ONLINE",
      },
    },

    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        },
        total: {
          $sum: {
            $multiply: ["$items.price", "$items.quantity"],
          },
        },
      },
    },

    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const formatted = revenue.map((r) => ({
    month: `${r._id.month}/${r._id.year}`,
    revenue: r.total,
  }));

  res.json({ success: true, revenue: formatted });
};

/* ======================================================
   ADMIN → SELLER SETTLEMENT SUMMARY
====================================================== */
export const getSellerSettlementSummary = async (req, res) => {
  const commissionRate = 0.1;

  const data = await Order.aggregate([
    { $unwind: "$items" },

    // ✅ FIXED FIELD NAME HERE
    {
      $match: {
        "items.status": "DELIVERED",
        "items.adminSettlementStatus": "PENDING",
      },
    },

    {
      $group: {
        _id: "$items.seller",

        onlineRevenue: {
          $sum: {
            $cond: [
              { $eq: ["$items.paymentMethod", "ONLINE"] },
              { $multiply: ["$items.price", "$items.quantity"] },
              0,
            ],
          },
        },

        codRevenue: {
          $sum: {
            $cond: [
              { $eq: ["$items.paymentMethod", "COD"] },
              { $multiply: ["$items.price", "$items.quantity"] },
              0,
            ],
          },
        },
      },
    },

    {
      $project: {
        sellerId: "$_id",

        onlineRevenue: 1,
        codRevenue: 1,

        onlineCommission: {
          $multiply: ["$onlineRevenue", commissionRate],
        },

        codCommission: {
          $multiply: ["$codRevenue", commissionRate],
        },

        onlinePayout: {
          $subtract: [
            "$onlineRevenue",
            { $multiply: ["$onlineRevenue", commissionRate] },
          ],
        },
      },
    },

    {
      $project: {
        sellerId: 1,
        onlineRevenue: 1,
        codRevenue: 1,
        onlineCommission: 1,
        codCommission: 1,
        onlinePayout: 1,

        netSettlement: {
          $subtract: ["$onlinePayout", "$codCommission"],
        },
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "sellerId",
        foreignField: "_id",
        as: "seller",
      },
    },
    { $unwind: "$seller" },

    {
      $project: {
        sellerId: 1,
        name: "$seller.name",
        email: "$seller.email",
        onlineRevenue: 1,
        codRevenue: 1,
        onlineCommission: 1,
        codCommission: 1,
        onlinePayout: 1,
        netSettlement: 1,
      },
    },
  ]);

  res.json({
    success: true,
    settlements: data,
  });
};



export const settleSellerItem = async (req, res) => {
  const { orderId, itemId } = req.body;

  const order = await Order.findById(orderId);
  if (!order)
    return res.status(404).json({ message: "Order not found" });

  const item = order.items.id(itemId);
  if (!item)
    return res.status(404).json({ message: "Item not found" });

  if (item.status !== "DELIVERED") {
    return res
      .status(400)
      .json({ message: "Only delivered items can be settled" });
  }

  if (item.adminSettlementStatus === "SETTLED") {
    return res
      .status(400)
      .json({ message: "Item already settled" });
  }

  // ✅ IMPORTANT FIX
  item.adminSettlementStatus = "SETTLED";
  item.settledAt = new Date(); // 👈 THIS LINE WAS MISSING

  await order.save();

  res.json({
    success: true,
    message: "Settlement completed",
  });
};


export const getPendingItemSettlements = async (req, res) => {
  const items = await Order.aggregate([
    { $unwind: "$items" },

    {
      $match: {
        "items.status": "DELIVERED",
        "items.adminSettlementStatus": "PENDING",
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "items.seller",
        foreignField: "_id",
        as: "seller",
      },
    },
    { $unwind: "$seller" },

    {
      $project: {
        orderId: "$_id",
        itemId: "$items._id",

        productName: "$items.name",
        quantity: "$items.quantity",
        price: "$items.price",

        paymentMethod: "$items.paymentMethod",
        commissionAmount: "$items.commissionAmount",
        sellerPayout: "$items.sellerPayout",

        sellerId: "$seller._id",
        sellerName: "$seller.name",
        sellerEmail: "$seller.email",

        createdAt: "$createdAt",
      },
    },

    { $sort: { createdAt: -1 } },
  ]);

  res.json({
    success: true,
    items,
  });
};

export const getSettlementHistory = async (req, res) => {
  const items = await Order.aggregate([
    { $unwind: "$items" },

    {
      $match: {
        "items.adminSettlementStatus": "SETTLED",
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "items.seller",
        foreignField: "_id",
        as: "seller",
      },
    },
    { $unwind: "$seller" },

    {
      $lookup: {
        from: "users",
        localField: "items.settledBy",
        foreignField: "_id",
        as: "admin",
      },
    },
    { $unwind: { path: "$admin", preserveNullAndEmptyArrays: true } },

    {
      $project: {
        orderId: "$_id",
        itemId: "$items._id",

        productName: "$items.name",
        quantity: "$items.quantity",

        paymentMethod: "$items.paymentMethod",
        commissionAmount: "$items.commissionAmount",
        sellerPayout: "$items.sellerPayout",

        sellerName: "$seller.name",
        sellerEmail: "$seller.email",

        settledAt: "$items.settledAt",
        settledBy: "$admin.name",

        createdAt: "$createdAt",
      },
    },

    { $sort: { settledAt: -1 } },
  ]);

  res.json({
    success: true,
    history: items,
  });
};
