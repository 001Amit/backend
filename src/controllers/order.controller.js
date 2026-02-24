import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import sendEmail from "../services/email.service.js";

/* ======================================================
   PLACE ORDER (CUSTOMER)
   - COD → order placed immediately
   - ONLINE → order created as PENDING_PAYMENT
====================================================== */
export const placeOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;

    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const sellerOrdersMap = {};

    cart.items.forEach((cartItem) => {
      const sellerId = cartItem.product.seller.toString();

      if (!sellerOrdersMap[sellerId]) {
        sellerOrdersMap[sellerId] = [];
      }
     const selectedVariant = cartItem.product.variants.find(
  v => v._id.toString() === cartItem.variantId.toString()
);

if (!selectedVariant) {
  throw new Error("Selected variant not found");
}

sellerOrdersMap[sellerId].push({
  product: cartItem.product._id,
  seller: cartItem.product.seller,

  // ✅ Variant Snapshot
  variantId: selectedVariant._id,
  variantName: selectedVariant.name,
  variantColor: selectedVariant.color,
  variantSize: selectedVariant.size,

  // ✅ Product Snapshot
  name: cartItem.product.name,
  image:
    cartItem.product.images?.[0]?.url ||
    cartItem.product.images?.[0] ||
    "",

  // ✅ PRICE & QTY SNAPSHOT (THIS IS WHAT YOU ARE MISSING)
  price: cartItem.price,
  quantity: cartItem.quantity,

  paymentMethod,

  status:
    paymentMethod === "ONLINE"
      ? "PENDING_PAYMENT"
      : "PLACED",

  commissionAmount: 0,
  sellerPayout: 0,
  adminSettlementStatus: "PENDING",
});
    });
    

    const createdOrders = [];

    for (const sellerId in sellerOrdersMap) {
      const items = sellerOrdersMap[sellerId];

      const totalAmount = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const order = await Order.create({
        user: req.user._id,
        items,
        shippingAddress,
        paymentMethod,
        totalAmount,
      });

      createdOrders.push(order);
    }

    // ✅ Clear cart ONLY for COD
    if (paymentMethod === "COD") {
      cart.items = [];
      cart.totalPrice = 0;
      await cart.save();

      await sendEmail({
        to: req.user.email,
        subject: "Order Placed Successfully",
        html: `<h2>Your order has been placed successfully</h2>`,
      });
    }

    res.status(201).json({
      success: true,
      orders: createdOrders,
    });
  } catch (error) {
    console.error("PLACE ORDER ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   CONFIRM ONLINE PAYMENT (RAZORPAY SUCCESS)
====================================================== */
export const confirmOnlinePayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.items.forEach((item) => {
      if (item.paymentMethod === "ONLINE") {
        item.status = "PLACED";
        item.adminSettlementStatus = "PENDING";
      }
    });

    await order.save();

    const cart = await Cart.findOne({ user: order.user });
    if (cart) {
      cart.items = [];
      cart.totalPrice = 0;
      await cart.save();
    }

    res.json({ success: true });
  } catch (error) {
    console.error("PAYMENT CONFIRM ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};


/* ======================================================
   CANCEL ONLINE ORDER (PAYMENT DISMISSED)
====================================================== */
export const cancelPendingOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.paymentMethod !== "ONLINE") {
      return res
        .status(400)
        .json({ message: "Only online orders can be cancelled" });
    }

    order.items.forEach((item) => {
      if (item.status === "PENDING_PAYMENT") {
        item.status = "CANCELLED";
        item.cancelledAt = Date.now();
      }
    });

    await order.save();

    res.json({ success: true, message: "Order cancelled" });
  } catch (error) {
    console.error("ORDER CANCEL ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   CUSTOMER ORDERS
====================================================== */
export const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    
    .sort({ createdAt: -1 });

  res.json({ success: true, orders });
};

/* ======================================================
   SELLER ORDERS
====================================================== */
export const getSellerOrders = async (req, res) => {
  const orders = await Order.find({
    "items.seller": req.user._id,
  })
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.json({ success: true, orders });
};

/* ======================================================
   UPDATE SELLER ITEM STATUS
====================================================== */
export const updateSellerOrderStatus = async (req, res) => {
  const { orderId, itemId, status } = req.body;

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  const item = order.items.id(itemId);
  if (!item) return res.status(404).json({ message: "Item not found" });

  if (item.seller.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Unauthorized" });
  }
if (status === "DELIVERED") {
  const revenue = item.price * item.quantity;
  const commissionRate = 0.1; // 10%

  item.commissionAmount = revenue * commissionRate;

  if (item.paymentMethod === "ONLINE") {
    // Admin already has money
    item.sellerPayout = revenue - item.commissionAmount;
    item.adminSettlementStatus = "PENDING";
  }

  if (item.paymentMethod === "COD") {
    // Seller has full money, owes commission to admin
    item.sellerPayout = revenue;
    item.adminSettlementStatus = "PENDING"; // commission pending
  }
}
  item.status = status;
  await order.save();

  res.json({ success: true });
};

/* ======================================================
   SELLER CANCEL ITEM
====================================================== */
export const cancelSellerItem = async (req, res) => {
  const { orderId, itemId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  const item = order.items.id(itemId);
  if (!item) return res.status(404).json({ message: "Item not found" });

  if (item.seller.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  if (item.status === "DELIVERED") {
    return res
      .status(400)
      .json({ message: "Delivered item cannot be cancelled" });
  }

  item.status = "CANCELLED";
  item.cancelledAt = Date.now();

  await order.save();

  res.json({ success: true });
};

/* ======================================================
   CUSTOMER CANCEL ITEM
====================================================== */
export const cancelCustomerItem = async (req, res) => {
  const { orderId, itemId } = req.body;

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  if (order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  const item = order.items.id(itemId);
  if (!item) return res.status(404).json({ message: "Item not found" });

  if (["SHIPPED", "DELIVERED"].includes(item.status)) {
    return res
      .status(400)
      .json({ message: "Item cannot be cancelled now" });
  }

  item.status = "CANCELLED";
  item.cancelledAt = Date.now();

  await order.save();

  res.json({ success: true });
};
