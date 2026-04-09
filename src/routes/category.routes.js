import express from "express";
import protect from "../middleware/auth.middleware.js";
import authorize from "../middleware/role.middleware.js";
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  getAllCategories,
  getCategoryById
} from "../controllers/category.controller.js";

const router = express.Router();

/* Public */
router.get("/", getCategories);
router.get("/all", getAllCategories); 
router.get("/:id", getCategoryById);
/* Admin */
router.post("/", protect, authorize("admin"), createCategory);
router.put("/:id", protect, authorize("admin"), updateCategory);
router.delete("/:id", protect, authorize("admin"), deleteCategory);

export default router;
