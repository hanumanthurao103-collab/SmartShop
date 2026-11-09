const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Create a new order using a MongoDB transaction
router.post("/", protect, async (req, res) => {
  const session = await mongoose.startSession();
  let createdOrder;

  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return res.status(400).json({
        message: "Invalid order items"
      });
    }

    const quantities = new Map();

    for (const item of items) {
      if (
        !item ||
        typeof item.product !== "string" ||
        !mongoose.Types.ObjectId.isValid(item.product) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return res.status(400).json({
          message: "Invalid product or quantity"
        });
      }

      const productId = item.product;

      quantities.set(
        productId,
        (quantities.get(productId) || 0) + item.quantity
      );
    }

    const orderItems = [];
    let totalAmount = 0;

    await session.withTransaction(async () => {
      orderItems.length = 0;
      totalAmount = 0;

      const productIds = [...quantities.keys()].sort();

      for (const productId of productIds) {
        const quantity = quantities.get(productId);

        const product = await Product.findOneAndUpdate(
          {
            _id: productId,
            stock: { $gte: quantity }
          },
          {
            $inc: { stock: -quantity }
          },
          {
            new: true,
            session
          }
        );

        if (!product) {
          const exists = await Product.exists({
            _id: productId
          }).session(session);

          if (!exists) {
            throw new Error("PRODUCT_NOT_FOUND");
          }

          throw new Error("INSUFFICIENT_STOCK");
        }

        orderItems.push({
          product: product._id,
          quantity,
          price: product.price
        });

        totalAmount += product.price * quantity;
      }

      const createdOrders = await Order.create(
        [
          {
            user: req.user.userId,
            items: orderItems,
            totalAmount
          }
        ],
        { session }
      );

      createdOrder = createdOrders[0];
    });

    res.status(201).json({
      message: "Order created successfully",
      order: createdOrder
    });
  } catch (error) {
    if (error.message === "PRODUCT_NOT_FOUND") {
      return res.status(400).json({
        message: "One or more products were not found"
      });
    }

    if (error.message === "INSUFFICIENT_STOCK") {
      return res.status(400).json({
        message: "Insufficient product stock"
      });
    }

    console.error("Order creation error:", error.message);

    res.status(500).json({
      message: "Failed to create order"
    });
  } finally {
    await session.endSession();
  }
});

// Get orders belonging to the logged-in customer
router.get("/", protect, async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user.userId
    }).populate("items.product", "name price");

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch orders"
    });
  }
});

// Admin can view all orders
router.get("/admin/all", protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .populate("items.product", "name price");

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch all orders"
    });
  }
});

module.exports = router;