require("dotenv").config({ path: "./backend/.env" });

const express = require("express");
const connectDB = require("./config/db");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const app = express();

app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "SmartShop backend is running"
  });
});

// Product routes
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`SmartShop backend running on http://localhost:${PORT}`);
  });
};

startServer();