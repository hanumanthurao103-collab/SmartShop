const express = require("express");
const Product = require("../models/Product");

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
router.post("/", async (req, res) => {
  try {
    const { name, description, price, category, stock, imageUrl } = req.body;

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
      stock < 0
    ) {
      return res.status(400).json({
        message: "Invalid product data"
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock,
      imageUrl
    });

    res.status(201).json(product);
    } catch (error) {
    console.error("Product creation error:", error);

    res.status(400).json({
      message: "Failed to create product"
    });
  }
});

module.exports = router;