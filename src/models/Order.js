import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },

  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  

  name: String,
  image: String,

  price: Number,
  quantity: Number,
  variantName: String,
  variantColor: String,
  variantSize: String,

  status: {
    type: String,
    enum: [
      "PENDING_PAYMENT",
      "PLACED",
      "CONFIRMED",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ],
    default: "PLACED",
  },

  /* SOURCE OF TRUTH FOR PAYMENT */
  paymentMethod: {
    type: String,
    enum: ["COD", "ONLINE"],
    required: true,
  },

  /* COMMISSION & PAYOUT */
  commissionAmount: {
    type: Number,
    default: 0,
  },
  commissionRate: {
  type: Number,
  default: 0.1, // 10% at time of order
},



  sellerPayout: {
    type: Number,
    default: 0,
  },

  adminSettlementStatus: {
    type: String,
    enum: ["PENDING", "SETTLED"],
    default: "PENDING",
  },
  settledAt: {
  type: Date,
  default:null,
},

  cancelledAt: Date,
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [orderItemSchema],

    shippingAddress: {
      address: String,
      city: String,
      state: String,
      pincode: String,
      phone: String,
    },

    /* REFERENCE ONLY */
    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"],
      required: true,
    },

    totalAmount:{
      type: Number,
      required: true,
    }
  },
  { timestamps: true }
);

/* PERFORMANCE INDEXES */
orderSchema.index({ "items.seller": 1 });
orderSchema.index({ "items.status": 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model("Order", orderSchema);
