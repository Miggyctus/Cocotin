import prisma from "../database/prisma";
import { Request, Response } from "express";

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

    res.json(productos);

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
    const { name, description, price, stock, category } = req.body;

    const image = req.file ? `/uploads/${req.file.filename}` : null;

    if (!category) {
      return res.status(400).json({ error: "Categoría requerida" });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: Number(price),
        stock: Number(stock),
        image,
        category: {
          connectOrCreate: {
            where: { name: category },
            create: { name: category },
          },
        },
      },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear producto" });
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

    res.json(producto);

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

    const { name, description, price, stock, category } = req.body;

    let categoryId = existingProduct.categoryId;

    // Si viene categoría nueva
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

    const updated = await prisma.product.update({
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
  } catch (error) {
    console.error("updateProduct:", error);
    res.status(500).json({ error: "Error actualizando producto" });
  }
};