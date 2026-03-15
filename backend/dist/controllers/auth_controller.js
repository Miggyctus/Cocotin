"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.me = me;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = __importDefault(require("../database/prisma"));
const jwt_1 = require("../utils/jwt");
async function login(req, res) {
    const { email, password } = req.body;
    const user = await prisma_1.default.users.findUnique({ where: { email } });
    if (!user || user.role !== "ADMIN") {
        return res.status(401).json({ error: "Credenciales inválidas" });
    }
    const valid = await bcrypt_1.default.compare(password, user.password);
    if (!valid) {
        return res.status(401).json({ error: "Credenciales inválidas" });
    }
    const token = (0, jwt_1.signToken)({ id: user.id, role: user.role });
    res.json({ token });
}
async function me(req, res) {
    res.json(req.user);
}
