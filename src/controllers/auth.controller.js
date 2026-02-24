import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import generateOTP from "../utils/generateOTP.js";
import sendEmail from "../services/email.service.js";

/* REGISTER */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    const otp = generateOTP();

    // ✅ allow only customer or seller
    let finalRole = "customer";
    if (role === "seller") {
      finalRole = "seller";
    }

    const user = await User.create({
      name,
      email,
      password,
      role: finalRole,
      isApproved: finalRole === "seller" ? false : true,
      otp,
      otpExpiry: Date.now() + 10 * 60 * 1000,
    });

    await sendEmail({
      to: email,
      subject: "Verify your email",
      html: `<h3>Your OTP is ${otp}</h3>`,
    });

    res.status(201).json({
      success: true,
      message: "OTP sent to email",
    });
  } catch (error) {
    next(error);
  }
};



/* VERIFY OTP */
export const verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email, otp });

    if (!user || user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    next(error);
  }
};

/* LOGIN */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user)
      return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    if (!user.isEmailVerified)
      return res.status(403).json({ message: "Verify your email first" });

    if (user.isBanned)
      return res.status(403).json({ message: "Account banned" });

    if (user.role === "seller" && !user.isApproved)
      return res
        .status(403)
        .json({ message: "Seller approval pending" });

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};


/* LOGOUT */
export const logout = (req, res) => {
  res.cookie("token", "", { maxAge: 0 });
  res.json({ success: true, message: "Logged out" });
};
