import { Router } from "express";
import { createOrder, getOrders, getStats, updateOrderStatus } from "../controllers/order_controller";
import { requireAuth, requireAdmin } from "../middleware/auth_middleware";

const router = Router();

// cliente
router.post("/", createOrder);

// admin
router.get("/", requireAuth, requireAdmin, getOrders);
router.get("/stats", requireAuth, requireAdmin, getStats);
router.patch(
  "/:id/status",
  requireAuth,
  requireAdmin,
  updateOrderStatus
);

export default router;