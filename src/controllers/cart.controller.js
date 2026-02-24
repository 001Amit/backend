import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

/* GET CART */
export const getCart = async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate("items.product");

  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }

  res.json(cart);
};

/* ADD TO CART */
export const addToCart = async (req, res) => {
  const { productId, variantId, quantity } = req.body;

  const product = await Product.findById(productId);
  if (!product) return res.status(404).json({ message: "Product not found" });

  const variant = product.variants.id(variantId);
  if (!variant) return res.status(400).json({ message: "Invalid variant" });

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });

  const itemIndex = cart.items.findIndex(
    (item) =>
      item.product.toString() === productId &&
      item.variantId.toString() === variantId
  );

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity += quantity;
  } else {
    cart.items.push({
      product: productId,
      variantId,
      quantity,
      price: variant.price,
    });
  }

  cart.totalPrice = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  await cart.save();
  const populatedCart = await Cart.findById(cart._id)
  .populate("items.product");
  res.json(populatedCart);
};

/* UPDATE QUANTITY */
export const updateCartItem = async (req, res) => {
  const { quantity } = req.body;
  const { itemId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  const item = cart.items.id(itemId);
  if (!item) return res.status(404).json({ message: "Item not found" });

  item.quantity = quantity;

  cart.totalPrice = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  await cart.save();

  // 🔥 POPULATE BEFORE RETURNING
  const populatedCart = await Cart.findById(cart._id)
    .populate("items.product");

  res.json(populatedCart);
};

/* REMOVE ITEM */
export const removeCartItem = async (req, res) => {
  const { itemId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  cart.items = cart.items.filter(
    (item) => item._id.toString() !== itemId
  );

  cart.totalPrice = cart.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  await cart.save();

  // 🔥 POPULATE BEFORE RETURNING
  const populatedCart = await Cart.findById(cart._id)
    .populate("items.product");

  res.json(populatedCart);
};
