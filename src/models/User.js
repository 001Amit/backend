import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "seller", "customer"],
      default: "customer",
    },

    isEmailVerified: { type: Boolean, default: false },

    wishlist: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    ],

    isApproved: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },

    otp: String,
    otpExpiry: Date,

    resetPasswordToken: String,
    resetPasswordExpiry: Date,
  },
  { timestamps: true }
);

/* Hash password */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
});


/* Compare password */
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

export default mongoose.model("User", userSchema);
