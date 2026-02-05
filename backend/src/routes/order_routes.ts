import { Router } from "express";
import { createOrder, getOrders, getStats } from "../controllers/order_controller";
import { requireAuth, requireAdmin } from "../middleware/auth_middleware";

const router = Router();

/**
 * Crear un pedido desde el carrito
 * POST /api/orders
 */
router.post("/orders", createOrder);
router.get("/orders", requireAuth, requireAdmin, getOrders);
router.get("/stats", requireAuth, requireAdmin, getStats);

export default router;
