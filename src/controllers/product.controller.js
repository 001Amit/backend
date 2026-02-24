import Product from "../models/Product.js";
import cloudinary from "../config/cloudinary.js";
import APIFeatures from "../utils/apiFeatures.js";

/* ======================================================
   CREATE PRODUCT (SELLER)
====================================================== */
export const createProduct = async (req, res, next) => {
  try {
    const { name, description, category } = req.body;

    if (!description || !category) {
      return res.status(400).json({
        message: "Description and category are required",
      });
    }

    // 🔥 PARSE VARIANTS
    let variants = [];
    if (req.body.variants) {
      variants = JSON.parse(req.body.variants);
    }

    // 🔥 FORCE AT LEAST ONE VARIANT
    if (!variants || variants.length === 0) {
      return res.status(400).json({
        message: "At least one variant is required",
      });
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        const result = await cloudinary.uploader.upload(file.path);
        images.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
    }

    const product = await Product.create({
      name,
      description,
      category,
      variants,            // ✅ SAVED
      images,
      seller: req.user._id,
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
};


/* ======================================================
   GET ALL PRODUCTS (PUBLIC)
====================================================== */
export const getProducts = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 8;
  const skip = (page - 1) * limit;

  const keyword = req.query.keyword
    ? {
        name: {
          $regex: req.query.keyword,
          $options: "i", // case-insensitive
        },
      }
    : {};

  const filter = {
    isActive: true,
    ...keyword,
  };

  const total = await Product.countDocuments(filter);

  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    products,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  });
};

/* ======================================================
   SEARCH AUTOCOMPLETE
====================================================== */
export const searchAutocomplete = async (req, res) => {
  const products = await Product.find({
    name: { $regex: req.query.q, $options: "i" },
  }).select("name");

  res.json(products);
};

/* ======================================================
   GET SELLER PRODUCTS
====================================================== */
export const getSellerProducts = async (req, res) => {
  const sellerId = req.user._id;

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  const total = await Product.countDocuments({ seller: sellerId });

  const products = await Product.find({ seller: sellerId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    products,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  });
};

/* ======================================================
   DELETE PRODUCT (SELLER)
====================================================== */
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product)
      return res.status(404).json({ message: "Product not found" });

    if (product.seller.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    // 🔥 delete images from Cloudinary
    for (let img of product.images) {
      if (img.public_id) {
        await cloudinary.uploader.destroy(img.public_id);
      }
    }

    await product.deleteOne();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

/* ======================================================
   UPDATE PRODUCT (SELLER)
====================================================== */
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product)
      return res.status(404).json({ message: "Product not found" });

    if (product.seller.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    /* ---------- BASIC FIELDS ---------- */
    if (req.body.name !== undefined) 
      product.name = req.body.name;
    if (req.body.price !== undefined)
      product.price = Number(req.body.price);
    if (req.body.stock !== undefined)
      product.stock = Number(req.body.stock);
    if (req.body.description !== undefined)
      product.description = req.body.description;
    if (req.body.category !== undefined)
      product.category = req.body.category;

    /* ---------- IMAGES ---------- */
    if (req.files && req.files.length > 0) {
      // 🔥 delete old images from Cloudinary
      for (let img of product.images) {
        if (img.public_id) {
          await cloudinary.uploader.destroy(img.public_id);
        }
      }

      product.images = [];

      // 🔥 upload new images
      for (let file of req.files) {
        if (!file.path) {
          throw new Error("File path missing (multer issue)");
        }

        const result = await cloudinary.uploader.upload(file.path);

        product.images.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
    }
    /* ---------- VARIANTS ---------- */
    if (req.body.variants !== undefined) {
      const parsedVariants = JSON.parse(req.body.variants);
      if (!parsedVariants || parsedVariants.length === 0) {
        return res
        .status(400)
        .json({ message: "At least one variant is required" });
      }
      product.variants = parsedVariants;
    }
    await product.save();
    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};

/* ======================================================
   GET PRODUCT BY ID
====================================================== */
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product)
      return res.status(404).json({ message: "Product not found" });

    res.json({ success: true, product });
  } catch (error) {
    next(error);
  }
};
