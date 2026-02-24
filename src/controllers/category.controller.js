import Category from "../models/Category.js";
import Product from "../models/Product.js";

/* CREATE (ADMIN) */
export const createCategory = async (req, res) => {
  const { name } = req.body;

  if (!name)
    return res.status(400).json({ message: "Name is required" });

  const exists = await Category.findOne({ name });
  if (exists)
    return res.status(400).json({ message: "Category already exists" });

  const category = await Category.create({
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
  });

  res.status(201).json({ success: true, category });
};

/* READ (PUBLIC / ADMIN) */
export const getCategories = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  // Total categories count
  const total = await Category.countDocuments();

  const categories = await Category.aggregate([
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "category",
        as: "products",
      },
    },
    {
      $addFields: {
        productCount: { $size: "$products" },
      },
    },
    {
      $project: {
        products: 0,
      },
    },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  ]);

  res.json({
    success: true,
    categories,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  });
};
/* UPDATE (ADMIN) */
export const updateCategory = async (req, res) => {
  const { name } = req.body;

  const category = await Category.findById(req.params.id);
  if (!category)
    return res.status(404).json({ message: "Category not found" });

  category.name = name;
  category.slug = name.toLowerCase().replace(/\s+/g, "-");
  await category.save();

  res.json({ success: true, category });
};

/* DELETE (ADMIN) */
export const deleteCategory = async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category)
    return res.status(404).json({ message: "Category not found" });

  // 🔒 Safety check
  const used = await Product.countDocuments({ category: category._id });
  if (used > 0) {
    return res
      .status(400)
      .json({ message: "Category has products, cannot delete" });
  }

  await category.deleteOne();
  res.json({ success: true });
};
/* GET ALL CATEGORIES (NO PAGINATION) */
export const getAllCategories = async (req, res) => {
  const categories = await Category.find()
    .select("_id name slug")
    .sort({ name: 1 });

  res.json({
    success: true,
    categories,
  });
};

