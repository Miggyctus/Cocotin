import prisma from "../database/prisma";
import { Request, Response } from "express";

export const getProducts = async (_req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
    },
    include: {
      category: true,
    },
  });

  res.json(products);
};

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
