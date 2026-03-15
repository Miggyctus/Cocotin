"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProduct = exports.createProduct = void 0;
exports.getProducts = getProducts;
exports.toggleProduct = toggleProduct;
exports.getProductById = getProductById;
const prisma_1 = __importDefault(require("../database/prisma"));
async function getProducts(req, res) {
    try {
        const { category, limit } = req.query;
        const where = {
            isActive: true,
        };
        if (category) {
            where.category = {
                name: String(category),
            };
        }
        const productos = await prisma_1.default.product.findMany({
            where,
            include: {
                category: true,
            },
            take: limit ? Number(limit) : undefined,
            orderBy: {
                createdAt: "desc",
            },
        });
        res.json(productos);
    }
    catch (err) {
        console.error("getProducts:", err);
        res.status(500).json({ error: "Error obteniendo productos" });
    }
}
async function toggleProduct(req, res) {
    const id = Number(req.params.id);
    const product = await prisma_1.default.product.findUnique({ where: { id } });
    if (!product) {
        return res.status(404).json({ error: "Producto no encontrado" });
    }
    const updated = await prisma_1.default.product.update({
        where: { id },
        data: { isActive: !product.isActive },
    });
    res.json(updated);
}
const createProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category, barcode } = req.body;
        // 🔹 Validaciones básicas
        if (!name || typeof name !== "string") {
            return res.status(400).json({ error: "Nombre requerido" });
        }
        if (!barcode || typeof barcode !== "string") {
            return res.status(400).json({ error: "Código de barras requerido" });
        }
        if (!price || isNaN(Number(price))) {
            return res.status(400).json({ error: "Precio inválido" });
        }
        if (stock === undefined || isNaN(Number(stock))) {
            return res.status(400).json({ error: "Stock inválido" });
        }
        if (!category || typeof category !== "string") {
            return res.status(400).json({ error: "Categoría requerida" });
        }
        // 🔹 Verificar barcode duplicado
        const existingBarcode = await prisma_1.default.product.findUnique({
            where: { barcode },
        });
        if (existingBarcode) {
            return res.status(400).json({
                error: "Ya existe un producto con ese código de barras",
            });
        }
        // 🔹 Manejo de imagen
        const image = req.file ? `/uploads/${req.file.filename}` : null;
        // 🔹 Crear producto
        const product = await prisma_1.default.product.create({
            data: {
                name: name.trim(),
                description: description ? description.trim() : null,
                price: Number(price),
                stock: Number(stock),
                barcode: barcode.trim(),
                image,
                category: {
                    connectOrCreate: {
                        where: { name: category.trim() },
                        create: { name: category.trim() },
                    },
                },
            },
            include: {
                category: true,
            },
        });
        return res.status(201).json(product);
    }
    catch (error) {
        console.error("createProduct:", error);
        // 🔹 Protección contra error unique inesperado
        if (error.code === "P2002") {
            return res.status(400).json({
                error: "Código de barras duplicado",
            });
        }
        return res.status(500).json({
            error: "Error al crear producto",
        });
    }
};
exports.createProduct = createProduct;
async function getProductById(req, res) {
    try {
        const id = Number(req.params.id);
        if (!id) {
            return res.status(400).json({ error: "ID inválido" });
        }
        const producto = await prisma_1.default.product.findUnique({
            where: { id },
            include: {
                category: true,
            },
        });
        if (!producto || !producto.isActive) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }
        res.json(producto);
    }
    catch (err) {
        console.error("getProductById:", err);
        res.status(500).json({ error: "Error obteniendo producto" });
    }
}
const updateProduct = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!id) {
            return res.status(400).json({ error: "ID inválido" });
        }
        const existingProduct = await prisma_1.default.product.findUnique({
            where: { id },
        });
        if (!existingProduct) {
            return res.status(404).json({ error: "Producto no encontrado" });
        }
        const { name, description, price, stock, category } = req.body;
        let categoryId = existingProduct.categoryId;
        // Si viene categoría nueva
        if (category) {
            const categoryRecord = await prisma_1.default.category.upsert({
                where: { name: category },
                update: {},
                create: { name: category },
            });
            categoryId = categoryRecord.id;
        }
        const image = req.file
            ? `/uploads/${req.file.filename}`
            : existingProduct.image;
        const updated = await prisma_1.default.product.update({
            where: { id },
            data: {
                name: name ?? existingProduct.name,
                description: description ?? existingProduct.description,
                price: price ? Number(price) : existingProduct.price,
                stock: stock ? Number(stock) : existingProduct.stock,
                image,
                categoryId,
            },
            include: {
                category: true,
            },
        });
        res.json(updated);
    }
    catch (error) {
        console.error("updateProduct:", error);
        res.status(500).json({ error: "Error actualizando producto" });
    }
};
exports.updateProduct = updateProduct;
