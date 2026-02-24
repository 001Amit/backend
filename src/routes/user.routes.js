import express from "express";
import protect from "../middleware/auth.middleware.js";
import authorize from "../middleware/role.middleware.js";
import { toggleWishlist } from "../controllers/user.controller.js";
import { getMe } from "../controllers/user.controller.js";
const router = express.Router();

router.post("/wishlist", protect, authorize("customer"), toggleWishlist);

router.get("/me", protect, getMe);
export default router;
