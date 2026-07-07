import { Request, Response } from "express";
import prisma from "../database/prisma";
import crypto from "crypto";

const BANCARD_BASE_URL =
  process.env.BANCARD_ENV === "production"
    ? "https://vpos.infonet.com.py"
    : "https://vpos.infonet.com.py:8888";

const PUBLIC_KEY = process.env.BANCARD_PUBLIC_KEY!;
const PRIVATE_KEY = process.env.BANCARD_PRIVATE_KEY!;

function md5(input: string): string {
  return crypto.createHash("md5").update(input).digest("hex");
}

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

export async function initiatePayment(req: Request, res: Response) {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "orderId requerido" });
    }

    const order = await prisma.orders.findUnique({
      where: { id: Number(orderId) },
    });

    if (!order) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    if (order.status !== "PENDING") {
      return res.status(400).json({ error: "El pedido ya fue procesado" });
    }

    const shopProcessId = order.id;
    const amount = formatAmount(order.total);
    const currency = "PYG";
    const token = md5(PRIVATE_KEY + shopProcessId + amount + currency);

    const payload = {
      public_key: PUBLIC_KEY,
      operation: {
        token,
        shop_process_id: shopProcessId,
        currency,
        amount,
        description: "Compra en Cocotin",
        return_url: "https://cocotin.com.py/carrito.html?pago=ok",
        cancel_url: "https://cocotin.com.py/carrito.html?pago=cancelado",
      },
    };

    const response = await fetch(`${BANCARD_BASE_URL}/vpos/api/0.3/single_buy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { status: string; process_id?: string };

    if (data.status !== "success") {
      console.error("Bancard single_buy error:", data);
      return res.status(502).json({ error: "Error iniciando pago con Bancard" });
    }

    return res.json({ processId: data.process_id });
  } catch (error) {
    console.error("initiatePayment error:", error);
    return res.status(500).json({ error: "Error iniciando pago" });
  }
}

export async function getOrderStatus(req: Request, res: Response) {
  try {
    const orderId = Number(req.params.orderId);

    if (!orderId) {
      return res.status(400).json({ error: "orderId inválido" });
    }

    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, total: true },
    });

    if (!order) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    return res.json({ orderId: order.id, status: order.status, total: order.total });
  } catch (error) {
    console.error("getOrderStatus error:", error);
    return res.status(500).json({ error: "Error consultando pedido" });
  }
}

export async function rollbackPayment(req: Request, res: Response) {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "orderId requerido" });
    }

    const order = await prisma.orders.findUnique({
      where: { id: Number(orderId) },
    });

    if (!order) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const shopProcessId = order.id;
    const token = md5(PRIVATE_KEY + shopProcessId + "rollback" + "0.00");

    const payload = {
      public_key: PUBLIC_KEY,
      operation: { token, shop_process_id: shopProcessId },
    };

    const response = await fetch(`${BANCARD_BASE_URL}/vpos/api/0.3/single_buy/rollback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json() as { status: string; messages?: { key: string }[] };

    const success = data.status === "success" ||
      data.messages?.some(m => m.key === "RollbackSuccessful" || m.key === "PaymentNotFoundError");

    if (success) {
      await prisma.orders.update({
        where: { id: Number(orderId) },
        data: { status: "CANCELLED" },
      });
    }

    return res.json(data);
  } catch (error) {
    console.error("rollbackPayment error:", error);
    return res.status(500).json({ error: "Error ejecutando rollback" });
  }
}

export async function getConfirmation(req: Request, res: Response) {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "orderId requerido" });
    }

    const order = await prisma.orders.findUnique({
      where: { id: Number(orderId) },
    });

    if (!order) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    const shopProcessId = order.id;
    const token = md5(PRIVATE_KEY + shopProcessId + "get_confirmation");

    const payload = {
      public_key: PUBLIC_KEY,
      operation: { token, shop_process_id: shopProcessId },
    };

    const response = await fetch(`${BANCARD_BASE_URL}/vpos/api/0.3/single_buy/confirmations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error("getConfirmation error:", error);
    return res.status(500).json({ error: "Error consultando confirmación" });
  }
}

// Endpoint que Bancard llama para confirmar/cancelar un pago.
// Debe responder 200 con { status: "success" } en menos de 30 segundos.
export async function confirmPayment(req: Request, res: Response) {
  try {
    const { operation } = req.body;

    if (!operation) {
      return res.status(400).json({ status: "error" });
    }

    const {
      shop_process_id,
      response: bancardResponse,
      response_code,
      amount,
      currency,
      token,
    } = operation;

    // Verificar autenticidad del token enviado por Bancard
    const expectedToken = md5(
      PRIVATE_KEY + shop_process_id + "confirm" + amount + currency
    );

    if (token !== expectedToken) {
      console.error("Bancard confirm: token inválido para pedido", shop_process_id);
      return res.status(400).json({ status: "error" });
    }

    // Actualizar a PAID solo si la transacción fue aprobada (response "S" + response_code "00")
    if (bancardResponse === "S" && response_code === "00") {
      await prisma.orders.updateMany({
        where: { id: Number(shop_process_id), status: "PENDING" },
        data: { status: "PAID" },
      });
    }

    return res.json({ status: "success" });
  } catch (error) {
    console.error("confirmPayment error:", error);
    // Bancard necesita 200 para no reintentar
    return res.json({ status: "success" });
  }
}
