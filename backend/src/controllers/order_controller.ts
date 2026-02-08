import { Request, Response } from "express";
import prisma from "../database/prisma";
import { OrderStatus } from "@prisma/client";

export async function getOrders(req: Request, res: Response) {
  try {
    const orders = await prisma.orders.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    const payload = orders.map(order => ({
      id: order.id,
      total: Number(order.total),
      status: order.status,
      createdAt: order.createdAt,

      customer: {
        name: order.customerName,
        phone: order.customerPhone,
        email: order.customerEmail,
      },

      delivery: {
        address: order.deliveryAddress,
        method: order.deliveryMethod,
        notes: order.notes,
      },

      items: order.items.map(item => ({
        productId: item.productId,
        name: item.product.name,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.price) * item.quantity,
      })),
    }));

    res.json(payload);
  } catch (err) {
    console.error("getOrders error:", err);
    res.status(500).json({ error: "Error obteniendo pedidos" });
  }
}


export async function getStats(req: Request, res: Response) {
  try {
    const [
      totalOrders,
      pendingOrders,
      paidRevenue,
      productStatus,
    ] = await Promise.all([
      // Todos los pedidos
      prisma.orders.count(),

      // Pendientes reales
      prisma.orders.count({
        where: { status: "PENDING" },
      }),

      // 💰 Ingresos SOLO de pedidos pagados/avanzados
      prisma.orders.aggregate({
        _sum: { total: true },
        where: { status: { in: ["PAID", "CONFIRMED", "DELIVERED"] } },
      }),

      // Productos activos / inactivos
      prisma.product.groupBy({
        by: ["isActive"],
        _count: { _all: true },
      }),

      // Top productos SOLO de ventas reales
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        where: {
          order: { status: { in: ["PAID", "CONFIRMED", "DELIVERED"] } },
        },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);
      // 1️⃣ agregación cruda
    const topProductsRaw = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      where: {
        order: {
          status: { in: ["PAID", "CONFIRMED", "DELIVERED"] },
        },
      },
      orderBy: {
        _sum: { quantity: "desc" },
      },
      take: 5,
    });

    // 2️⃣ traemos nombres de productos
    const productIds = topProductsRaw.map(p => p.productId);

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });

    // 3️⃣ payload FINAL para el admin
    const topProducts = topProductsRaw.map(p => ({
      name: products.find(prod => prod.id === p.productId)?.name ?? "Desconocido",
      quantity: p._sum.quantity ?? 0,
    }));

    res.json({
      totalOrders: totalOrders ?? 0,
      pendingOrders: pendingOrders ?? 0,
      totalRevenue: Number(paidRevenue._sum.total ?? 0),
      products: {
        active:
          productStatus.find(p => p.isActive === true)?._count._all ?? 0,
        inactive:
          productStatus.find(p => p.isActive === false)?._count._all ?? 0,
      },
      topProducts: topProducts ?? [],
    });
  } catch (err) {
    console.error("getStats error:", err);
    res.status(500).json({ error: "Error obteniendo estadísticas" });
  }
}


export async function createOrder(req: Request, res: Response) {
  try {
    const {
      items,
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      deliveryMethod,
      notes,
    } = req.body;

    // 🔹 Validar carrito
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Carrito vacío" });
    }

    // 🔹 Validar datos del cliente
    if (
      typeof customerName !== "string" ||
      typeof customerPhone !== "string" ||
      typeof customerEmail !== "string" ||
      typeof deliveryAddress !== "string" ||
      typeof deliveryMethod !== "string"
    ) {
      return res.status(400).json({
        error: "Datos del comprador incompletos",
      });
    }

    const sanitizedCustomerName = customerName.trim();
    const sanitizedCustomerPhone = customerPhone.trim();
    const sanitizedCustomerEmail = customerEmail.trim();
    const sanitizedDeliveryAddress = deliveryAddress.trim();
    const sanitizedDeliveryMethod = deliveryMethod.trim();
    const sanitizedNotes =
      typeof notes === "string" ? notes.trim() : undefined;

    if (
      !sanitizedCustomerName ||
      !sanitizedCustomerPhone ||
      !sanitizedCustomerEmail ||
      !sanitizedDeliveryAddress ||
      !sanitizedDeliveryMethod
    ) {
      return res.status(400).json({
        error: "Todos los campos obligatorios deben completarse",
      });
    }

    // 🔹 Obtener productos
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

    /**
     * 🔥 VALIDACIÓN DE STOCK (SIN DESCONTAR)
     * Evita crear pedidos imposibles
     */
    for (const item of items) {
      const producto = productos.find(p => p.id === item.id);

      if (!producto) {
        return res.status(400).json({
          error: "Producto inválido",
        });
      }

      const quantity = Number(item.cantidad);
      if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({
          error: `Cantidad inválida para ${producto.name}`,
        });
      }

      if (producto.stock < quantity) {
        return res.status(400).json({
          error: `Stock insuficiente para ${producto.name}`,
        });
      }
    }

    // 🔹 Crear items y calcular total
    let total = 0;

    const orderItems = items.map((item: any) => {
      const producto = productos.find(p => p.id === item.id)!;

      const quantity = Number(item.cantidad);
      const price = Number(producto.price);
      const subtotal = price * quantity;

      total += subtotal;

      return {
        productId: producto.id,
        quantity,
        price: Math.round(price), // precio unitario
      };
    });

    // 🔹 Crear pedido (stock NO se toca acá)
    const order = await prisma.orders.create({
      data: {
        total: Math.round(total),
        status: "PENDING",
        customerName: sanitizedCustomerName,
        customerPhone: sanitizedCustomerPhone,
        customerEmail: sanitizedCustomerEmail,
        deliveryAddress: sanitizedDeliveryAddress,
        deliveryMethod: sanitizedDeliveryMethod,
        notes: sanitizedNotes || null,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
      },
    });

    return res.status(201).json({
      orderId: order.id,
      total: order.total,
      status: order.status,
    });
  } catch (error) {
    console.error("Error creando order:", error);
    return res.status(500).json({ error: "Error creando pedido" });
  }
}

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const orderId = Number(req.params.id);
    const { status } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "ID inválido" });
    }

    if (!Object.values(OrderStatus).includes(status)) {
      return res.status(400).json({ error: "Estado inválido" });
    }

    const nextStatus = status as OrderStatus;

    // 🔹 Traer pedido CON items
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    // 🔹 Transiciones permitidas
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!allowedTransitions[order.status].includes(nextStatus)) {
      return res.status(400).json({
        error: `No se puede pasar de ${order.status} a ${nextStatus}`,
      });
    }

    /**
     * 🔥 DESCONTAR STOCK SOLO EN PAID → CONFIRMED
     * El stock vive en product, NO en order
     */
    if (
      order.status === OrderStatus.PAID &&
      nextStatus === OrderStatus.CONFIRMED
    ) {
      // 1️⃣ Validar stock
      for (const item of order.items) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          return res.status(400).json({
            error: "Producto no encontrado",
          });
        }

        if (product.stock < item.quantity) {
          return res.status(400).json({
            error: `Stock insuficiente para ${product.name}`,
          });
        }
      }

      // 2️⃣ Descontar stock
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }
    }

    // 3️⃣ Actualizar estado del pedido
    await prisma.orders.update({
      where: { id: orderId },
      data: { status: nextStatus },
    });

    return res.json({
      success: true,
      orderId,
      status: nextStatus,
    });
  } catch (err) {
    console.error("updateOrderStatus:", err);
    return res.status(500).json({ error: "Error actualizando pedido" });
  }
}