"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("./product_controller");
const auth_middleware_1 = require("../middleware/auth_middleware");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
router.get("/", product_controller_1.getProducts);
router.patch("/:id/toggle", auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, product_controller_1.toggleProduct);
router.get("/:id", product_controller_1.getProductById);
router.put("/:id", auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, upload_1.upload.single("image"), product_controller_1.updateProduct);
router.post("/", auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, upload_1.upload.single("image"), // 👈 CLAVE
product_controller_1.createProduct);
exports.default = router;
