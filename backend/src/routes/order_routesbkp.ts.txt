import { Router } from "express";
import { createOrder, getOrders, getStats } from "../controllers/order_controller";

const router = Router();

/**
 * Crear un pedido desde el carrito
 * POST /api/orders
 */
router.post("/orders", createOrder);
router.get("/orders", getOrders);
router.get("/stats", getStats);

export default router;
