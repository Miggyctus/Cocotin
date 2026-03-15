"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireAdmin = requireAdmin;
const jwt_1 = require("../utils/jwt");
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header) {
        return res.status(401).json({ error: "No se proporcionó token de autorización" });
    }
    const token = header.split(" ")[1];
    try {
        const decoded = (0, jwt_1.verifyToken)(token);
        req.user = decoded;
        next();
    }
    catch {
        return res.status(401).json({ error: "Token inválido o expirado" });
    }
}
function requireAdmin(req, res, next) {
    if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ error: "Acceso denegado: rol requerido ADMIN" });
    }
    next();
}
