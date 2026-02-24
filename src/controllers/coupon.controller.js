import Coupon from "../models/Coupon.js";

/* CREATE COUPON */
export const createCoupon = async (req, res) => {
  const coupon = await Coupon.create({
    ...req.body,
    createdBy: req.user._id,
  });

  res.status(201).json(coupon);
};

/* APPLY COUPON */
export const applyCoupon = async (req, res) => {
  const { code, cartTotal } = req.body;

  const coupon = await Coupon.findOne({
    code,
    isActive: true,
    expiryDate: { $gt: Date.now() },
  });

  if (!coupon) {
    return res.status(400).json({ message: "Invalid or expired coupon" });
  }

  if (cartTotal < coupon.minOrderAmount) {
    return res.status(400).json({
      message: `Minimum order amount is ${coupon.minOrderAmount}`,
    });
  }

  let discount = 0;

  if (coupon.discountType === "PERCENT") {
    discount = (cartTotal * coupon.discountValue) / 100;
  } else {
    discount = coupon.discountValue;
  }

  res.json({ discount });
};
