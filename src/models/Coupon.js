import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      uppercase: true,
      unique: true,
      required: true,
    },

    discountType: {
      type: String,
      enum: ["PERCENT", "FLAT"],
      required: true,
    },

    discountValue: Number,

    minOrderAmount: Number,

    expiryDate: Date,

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Coupon", couponSchema);
