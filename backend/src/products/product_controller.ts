import prisma from "../database/prisma";
import { Request, Response } from "express";
import { isDiscountActive, computeDiscountedPrice } from "./discount_utils";

function enrichWithDiscount(product: any) {
  const active = isDiscountActive(product);
  return {
    ...product,
    discountedPrice: active
      ? computeDiscountedPrice(product.price, product.discountPercent)
      : null,
  };
}

export async function getProducts(req: Request, res: Response) {
  try {
    const { category, limit } = req.query;

    const where: any = {
      isActive: true,
    };

    if (category) {
      where.category = {
        name: String(category),
      };
    }

    const productos = await prisma.product.findMany({
      where,
      include: {
        category: true,
      },
      take: limit ? Number(limit) : undefined,
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(productos.map(enrichWithDiscount));

  } catch (err) {
    console.error("getProducts:", err);
    res.status(500).json({ error: "Error obteniendo productos" });
  }
}

export async function toggleProduct(req: Request, res: Response) {
  const id = Number(req.params.id);

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return res.status(404).json({ error: "Producto no encontrado" });
  }

  const updated = await prisma.product.update({
    where: { id },
    data: { isActive: !product.isActive },
  });

  res.json(updated);
}



export const createProduct = async (req: Request, res: Response) => {
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
    const existingBarcode = await prisma.product.findUnique({
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
    const product = await prisma.product.create({
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
  } catch (error: any) {
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

export async function getProductById(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const producto = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!producto || !producto.isActive) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json(enrichWithDiscount(producto));

  } catch (err) {
    console.error("getProductById:", err);
    res.status(500).json({ error: "Error obteniendo producto" });
  }
}

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const { name, description, price, stock, category, discountPercent, discountStartDate, discountEndDate } = req.body;

    let categoryId = existingProduct.categoryId;

    if (category) {
      const categoryRecord = await prisma.category.upsert({
        where: { name: category },
        update: {},
        create: { name: category },
      });
      categoryId = categoryRecord.id;
    }

    const image = req.file
      ? `/uploads/${req.file.filename}`
      : existingProduct.image;

    const parsedDiscountPercent = discountPercent !== undefined && discountPercent !== ""
      ? parseFloat(discountPercent)
      : null;

    const parsedStartDate = discountStartDate ? new Date(discountStartDate) : null;
    const parsedEndDate = discountEndDate ? new Date(discountEndDate) : null;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name ?? existingProduct.name,
        description: description ?? existingProduct.description,
        price: price ? Number(price) : existingProduct.price,
        stock: stock ? Number(stock) : existingProduct.stock,
        image,
        categoryId,
        discountPercent: parsedDiscountPercent,
        discountStartDate: parsedStartDate,
        discountEndDate: parsedEndDate,
      },
      include: {
        category: true,
      },
    });

    res.json(enrichWithDiscount(updated));
  } catch (error) {
    console.error("updateProduct:", error);
    res.status(500).json({ error: "Error actualizando producto" });
  }
};

export async function applyCategoryDiscount(req: Request, res: Response) {
  try {
    const { categoryId, discountPercent, startDate, endDate } = req.body;

    if (!categoryId) {
      return res.status(400).json({ error: "categoryId requerido" });
    }

    const parsedPercent = discountPercent !== undefined && discountPercent !== ""
      ? parseFloat(discountPercent)
      : null;

    const parsedStart = startDate ? new Date(startDate) : null;
    const parsedEnd = endDate ? new Date(endDate) : null;

    const result = await prisma.product.updateMany({
      where: { categoryId: Number(categoryId) },
      data: {
        discountPercent: parsedPercent,
        discountStartDate: parsedStart,
        discountEndDate: parsedEnd,
      },
    });

    return res.json({ updated: result.count });
  } catch (error) {
    console.error("applyCategoryDiscount:", error);
    return res.status(500).json({ error: "Error aplicando descuento" });
  }
}
