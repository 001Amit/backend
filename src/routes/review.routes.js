import express from "express";
import protect from "../middleware/auth.middleware.js";
import authorize from "../middleware/role.middleware.js";
import upload from "../utils/uploadToCloudinary.js";
import {
  addReview,
  getReviews,
  canReviewProduct

} from "../controllers/review.controller.js";

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("customer"),
  upload.array("images", 3),
  addReview
);
router.get("/can-review/:productId", protect, canReviewProduct);

router.get("/:productId", getReviews);

export default router;
