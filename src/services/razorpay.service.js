import Razorpay from "razorpay";
import crypto from "crypto";

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID) {
    console.error("ENV RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);
    throw new Error("RAZORPAY_KEY_ID is missing");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

export const createRazorpayOrder = async (amount) => {
  const razorpay = getRazorpay();

  return await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  });
};

export const verifyPaymentSignature = (
  orderId,
  paymentId,
  signature
) => {
  const body = `${orderId}|${paymentId}`;

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  return expected === signature;
};
