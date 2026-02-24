import User from "../models/User.js";

/* ADD / REMOVE WISHLIST */
export const toggleWishlist = async (req, res) => {
  const user = await User.findById(req.user._id);
  const { productId } = req.body;

  const index = user.wishlist.indexOf(productId);

  if (index > -1) {
    user.wishlist.splice(index, 1);
  } else {
    user.wishlist.push(productId);
  }

  await user.save();
  res.json(user.wishlist);
};

export const getMe = async (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
};
