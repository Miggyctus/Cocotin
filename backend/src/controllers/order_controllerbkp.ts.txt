import { Request, Response } from "express";
import prisma from "../database/prisma";

export async function getOrders(req: Request, res: Response) {
  try {
    const orders = await prisma.orders.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo pedidos" });
  }
}

export async function getStats(req: Request, res: Response) {
  try {
    const [
      totalOrders,
      pendingOrders,
      totalRevenue,
      productStatus,
      topProducts,
    ] = await Promise.all([
      prisma.orders.count(),

      prisma.orders.count({
        where: { status: "PENDING" },
      }),

      prisma.orders.aggregate({
        _sum: { total: true },
      }),

      prisma.product.groupBy({
        by: ["isActive"],
        _count: { _all: true },
      }),

      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: {
          _sum: { quantity: "desc" },
        },
        take: 5,
      }),
    ]);

    const productsWithNames = await prisma.product.findMany({
      where: {
        id: { in: topProducts.map(p => p.productId) },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const top = topProducts.map(p => ({
      productId: p.productId,
      name: productsWithNames.find(x => x.id === p.productId)?.name ?? "Desconocido",
      quantity: p._sum.quantity ?? 0,
    }));

    res.json({
      totalOrders,
      pendingOrders,
      totalRevenue: totalRevenue._sum.total ?? 0,
      products: {
        active: productStatus.find(p => p.isActive === true)?._count._all ?? 0,
        inactive: productStatus.find(p => p.isActive === false)?._count._all ?? 0,
      },
      topProducts: top,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obteniendo estadísticas" });
  }
}


export async function createOrder(req: Request, res: Response) {
  try {
    const { items } = req.body;

    // =========================
    // Validaciones básicas
    // =========================
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Carrito vacío" });
    }

    // =========================
    // Traer productos reales
    // =========================
    const productIds = items.map((item: any) => item.id);

    const productos = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true,
      },
    });

    if (productos.length === 0) {
      return res.status(400).json({ error: "Productos inválidos" });
    }

    // =========================
    // Armar items del pedido
    // =========================
    let total = 0;

    const orderItems = items.map((item: any) => {
      const producto = productos.find(p => p.id === item.id);

      if (!producto) {
        throw new Error(`Producto no encontrado: ${item.id}`);
      }

      const price = Number(producto.price);
      const subtotal = price * item.cantidad;
      total += subtotal;

      return {
        productId: producto.id,
        quantity: item.cantidad,
        price: producto.price, // precio al momento de compra
      };
    });

    // =========================
    // Crear pedido + items
    // =========================
    const order = await prisma.orders.create({
      data: {
        total,
        status: "PENDING",
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
      },
    });

    // =========================
    // Respuesta
    // =========================
    res.status(201).json({
      orderId: order.id,
      total: order.total,
      status: order.status,
    });

  } catch (error) {
    console.error("Error creando order:", error);
    res.status(500).json({ error: "Error creando pedido" });
  }

  
}
