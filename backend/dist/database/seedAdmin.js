"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("./prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function seedAdmin() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const exist = await prisma_1.default.users.findUnique({ where: { email } });
    if (exist) {
        console.log("Admin ya existe, no se creó uno nuevo.");
        return;
    }
    const hashed = await bcrypt_1.default.hash(password, 12);
    await prisma_1.default.users.create({
        data: {
            name: "Admin",
            email,
            password: hashed,
            role: "ADMIN"
        }
    });
    console.log("Admin creado exitosamente.");
}
seedAdmin()
    .catch(console.error)
    .finally(() => prisma_1.default.$disconnect());
