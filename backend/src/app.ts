import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth_routes";
import productRoutes from "./products/product_routes";
import orderRoutes from "./routes/order_routes";
import path from "path";
import { getOrders, getStats } from "./controllers/order_controller";



const app = express();

app.use(cors());
app.use(express.json());

app.use("/products", productRoutes);


app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/health", (_, res) => {
  res.json({ status: "ok" });
});

app.use("/orders", orderRoutes);
app.use("/stats", orderRoutes);

app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend corriendo en http://localhost:${PORT}`);
});
