"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth_controller");
const auth_middleware_1 = require("../middleware/auth_middleware");
const router = (0, express_1.Router)();
router.post("/login", auth_controller_1.login);
router.get("/me", auth_middleware_1.requireAuth, auth_middleware_1.requireAdmin, auth_controller_1.me);
exports.default = router;
