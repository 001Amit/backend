import mongoose from "mongoose";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import cloudinary from "../config/cloudinary.js";

/* ADD REVIEW (Only if product delivered & not reviewed before) */
export const addReview = async (req, res) => {
  try {
    const { rating, comment, productId } = req.body;

    if (!rating || !productId) {
      return res.status(400).json({ message: "Rating and productId required" });
    }

    const productObjectId = new mongoose.Types.ObjectId(productId);

    /* 1️⃣ CHECK IF USER PURCHASED & ITEM DELIVERED */
    const order = await Order.findOne({
      user: req.user._id,
      items: {
        $elemMatch: {
          product: productObjectId,
          status: "DELIVERED",
        },
      },
    });

    if (!order) {
      return res
        .status(403)
        .json({ message: "You can review this product only after delivery" });
    }

    /* 2️⃣ PREVENT MULTIPLE REVIEWS */
    const alreadyReviewed = await Review.findOne({
      user: req.user._id,
      product: productObjectId,
    });

    if (alreadyReviewed) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this product" });
    }

    /* 3️⃣ IMAGE UPLOAD (OPTIONAL) */
    const images = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(
          `data:${file.mimetype};base64,${file.buffer.toString("base64")}`
        );

        images.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
    }

    /* 4️⃣ CREATE REVIEW */
    const review = await Review.create({
      user: req.user._id,
      product: productObjectId,
      rating,
      comment,
      images,
    });

    /* 5️⃣ UPDATE PRODUCT RATING */
    const reviews = await Review.find({ product: productObjectId });

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalRating / reviews.length;

    await Product.findByIdAndUpdate(productObjectId, {
      rating: Number(avgRating.toFixed(1)),
      numReviews: reviews.length,
    });

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      review,
    });

  } catch (error) {
    console.error("ADD REVIEW ERROR:", error);
    res.status(500).json({ message: "Failed to add review" });
  }
};


/* GET PRODUCT REVIEWS */
export const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      product: req.params.productId,
    })
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json(reviews);

  } catch (error) {
    console.error("GET REVIEW ERROR:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};
