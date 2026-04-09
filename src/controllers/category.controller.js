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

export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        message: "Category not found",
      });
    }

    res.json({
      success: true,
      category,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   GET PRODUCTS BY CATEGORY
====================================================== */
export const getProductsByCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      keyword,
      minPrice,
      maxPrice,
      sort,
    } = req.query;

    // 🔍 Base filter
    let query = {
      category: id,
      isActive: true,
    };

    // 🔎 Search inside category
    if (keyword) {
      query.name = {
        $regex: keyword,
        $options: "i",
      };
    }

    // 💰 Price filter (using base price or variant)
    if (minPrice || maxPrice) {
      query.price = {};

      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let productsQuery = Product.find(query);

    // 🔽 Sorting
    if (sort === "price_asc") {
      productsQuery = productsQuery.sort({ price: 1 });
    } else if (sort === "price_desc") {
      productsQuery = productsQuery.sort({ price: -1 });
    } else {
      productsQuery = productsQuery.sort({ createdAt: -1 });
    }

    const products = await productsQuery;

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Category Products Error:", error);
    res.status(500).json({
      message: "Failed to fetch category products",
    });
  }
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

