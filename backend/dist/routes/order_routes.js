"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const order_controller_1 = require("../controllers/order_controller");
const auth_middleware_1 = require("../middleware/auth_middleware");
const router = (0, express_1.Router)();
// cliente
router.post("/", order_controller_1.createOrder);
// admin
router.get("/", auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, order_controller_1.getOrders);
router.get("/stats", auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, order_controller_1.getStats);
router.patch("/:id/status", auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, order_controller_1.updateOrderStatus);
exports.default = router;
