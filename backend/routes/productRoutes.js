
const express = require("express");
const Product = require("../models/Product");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const createAuditLog = require("../middleware/auditMiddleware");

const router = express.Router();

// Get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find();

    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch products"
    });
  }
});

// Add a new product
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      stock,
      imageUrl
    } = req.body;

    // Validate product data
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      typeof category !== "string" ||
      !category.trim() ||
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      price < 0 ||
      typeof stock !== "number" ||
      !Number.isInteger(stock) ||
      stock < 0 ||
      (imageUrl !== undefined && typeof imageUrl !== "string")
    ) {
      return res.status(400).json({
        message: "Invalid product data"
      });
    }

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price,
      category: category.trim(),
      stock,
      imageUrl
    });

    // Record the admin action
    const auditRecorded = await createAuditLog({
      userId: req.user.userId,
      action: "PRODUCT_CREATED",
      resourceId: product._id,
      details: "Admin created a product"
    });

    res.status(201).json({
      ...product.toObject(),
      auditLogRecorded: auditRecorded
    });
  } catch (error) {
    console.error("Product creation error:", error.message);

    res.status(500).json({
      message: "Failed to create product"
    });
  }
});

module.exports = router;
