import Review from "../models/Review.js";
import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";
import Order from "../models/Order.js";

/* ADD REVIEW (Only if item is delivered & not reviewed before) */
export const addReview = async (req, res) => {
  try {
    const { rating, comment, productId } = req.body;

    /* 1️⃣ CHECK IF USER BOUGHT & ITEM IS DELIVERED */
    const order = await Order.findOne({
      user: req.user._id,
      items: {
        $elemMatch: {
          product: productId,
          status: "DELIVERED",
        },
      },
    });

    if (!order) {
      return res
        .status(403)
        .json({ message: "You can review only after delivery" });
    }

    /* 2️⃣ PREVENT MULTIPLE REVIEWS BY SAME USER */
    const alreadyReviewed = await Review.findOne({
      user: req.user._id,
      product: productId,
    });

    if (alreadyReviewed) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this product" });
    }

    /* 3️⃣ UPLOAD IMAGES (OPTIONAL) */
    const images = [];
    for (const file of req.files || []) {
      const result = await cloudinary.uploader.upload(
        `data:${file.mimetype};base64,${file.buffer.toString("base64")}`
      );
      images.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    /* 4️⃣ CREATE REVIEW */
    const review = await Review.create({
      user: req.user._id,
      product: productId,
      rating,
      comment,
      images,
    });

    /* 5️⃣ UPDATE PRODUCT RATING */
    const reviews = await Review.find({ product: productId });

    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await Product.findByIdAndUpdate(productId, {
      rating: avgRating.toFixed(1),
      numReviews: reviews.length,
    });

    res.status(201).json(review);
  } catch (error) {
    console.error("ADD REVIEW ERROR:", error);
    res.status(500).json({ message: "Failed to add review" });
  }
};


/* GET PRODUCT REVIEWS */
export const getReviews = async (req, res) => {
  const reviews = await Review.find({
    product: req.params.productId,
  })
    .populate("user", "name")
    .sort({ createdAt: -1 });

  res.json(reviews);
};

