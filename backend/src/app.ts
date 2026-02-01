import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth_routes";
import productRoutes from "./products/product_routes";
import path from "path";
import getOrders from "./routes/order_routes";
import getStats from "./routes/order_routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/products", productRoutes);

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

app.get("/orders", getOrders);

//app.get("/stats", getStats);

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});
