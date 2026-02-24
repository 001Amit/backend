import express from "express";
import {
  createProduct,
  getProducts,
  searchAutocomplete,
  getSellerProducts,
  deleteProduct,
  getProductById,
  updateProduct,
} from "../controllers/product.controller.js";
import multer from "multer";
import protect from "../middleware/auth.middleware.js";
import authorize from "../middleware/role.middleware.js";

const router = express.Router();

/* ---------------- MULTER CONFIG ---------------- */
const upload = multer({
  dest: "uploads/",
  limits: {
    files: 5, // max 5 images per product
    fileSize: 5 * 1024 * 1024, // 5MB per image
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image files are allowed"), false);
    } else {
      cb(null, true);
    }
  },
});

/* ---------------- PUBLIC ROUTES ---------------- */
router.get("/", getProducts);
router.get("/autocomplete", searchAutocomplete);

/* ---------------- SELLER ROUTES ---------------- */
/* MUST COME BEFORE :id */
router.get(
  "/seller/my-products",
  protect,
  authorize("seller"),
  getSellerProducts
);

router.post(
  "/",
  protect,
  authorize("seller"),
  upload.array("images", 5),
  createProduct
);

router.put(
  "/:id",
  protect,
  authorize("seller"),
  upload.array("images", 5),
  updateProduct
);

router.delete(
  "/:id",
  protect,
  authorize("seller"),
  deleteProduct
);

/* ---------------- PRODUCT BY ID ---------------- */
/* ALWAYS LAST */
router.get("/:id", getProductById);

export default router;
