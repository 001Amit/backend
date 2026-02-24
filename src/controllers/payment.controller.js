import {
  createRazorpayOrder,
  verifyPaymentSignature,
} from "../services/razorpay.service.js";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";


/* CREATE RAZORPAY ORDER */
export const createPaymentOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    const razorpayOrder = await createRazorpayOrder(amount);

    res.json({
      success: true,
      order: razorpayOrder,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("CREATE PAYMENT ORDER ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/* VERIFY PAYMENT */
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderIds,
    } = req.body;

    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({ message: "Payment verification failed" });
    }

    // Update all orders as paid
    await Order.updateMany(
      { _id: { $in: orderIds } },
      {
        $set: {
          paymentMethod: "ONLINE",
          "items.$[].status": "PLACED",
        },
      }
    );
    // Clear user's cart after successful payment
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          items: [],
          totalPrice: 0,
        },
      }
    );



    res.json({ success: true });
  } catch (error) {
    console.error("VERIFY PAYMENT ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
