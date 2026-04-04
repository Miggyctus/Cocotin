import { Router, Request, Response } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import prisma from "../database/prisma";
import { requireAuth, requireAdmin } from "../middleware/auth_middleware";

const router = Router();

// 📦 configuración subida archivo
const upload = multer({ dest: "uploads/" });

// 🔧 helper precio
function parsePrice(price: any): number {
  if (price === undefined || price === null || price === "") {
    return 0;
  }

  let raw = String(price).trim();
  raw = raw.replace(/[\s\u00A0]/g, "");
  raw = raw.replace(/[^0-9.,\-]/g, "");

  if (raw === "" || raw === "." || raw === ",") {
    return 0;
  }

  const commaCount = (raw.match(/,/g) || []).length;
  const dotCount = (raw.match(/\./g) || []).length;

  if (commaCount > 0 && dotCount > 0) {
    const decimalSeparator = raw.lastIndexOf(",") > raw.lastIndexOf(".") ? "," : ".";
    raw = raw.replace(new RegExp(`[^0-9${decimalSeparator}\-]`, "g"), "");
    raw = raw.replace(decimalSeparator, ".");
  } else if (commaCount > 0) {
    const lastCommaDistance = raw.length - raw.lastIndexOf(",") - 1;
    if (lastCommaDistance === 3) {
      raw = raw.replace(/,/g, "");
    } else {
      raw = raw.replace(/,/g, ".");
    }
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

// 🔧 helper URL
function isValidUrl(url: any): boolean {
  if (typeof url !== "string") return false;
  return /^https?:\/\//i.test(String(url).trim());
}

function normalizeUrl(url: any): string | null {
  if (typeof url !== "string") return null;
  let cleaned = String(url).trim();

  if (/^www\./i.test(cleaned)) {
    cleaned = `https://${cleaned}`;
  }

  return isValidUrl(cleaned) ? cleaned : null;
}

function extractCellValue(value: any): any {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "object") {
    if (value.t === "s" && typeof value.v === "string") return value.v.trim();
    if (value.l && typeof value.l.Target === "string") return value.l.Target.trim();
    if (value.v !== undefined) return extractCellValue(value.v);
    return undefined;
  }
  return undefined;
}

function normalizeKey(key: string): string {
  return String(key)
    .trim()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[\s_\-]+/g, " ")
    .toLowerCase();
}

function normalizeRow(row: any): any {
  const normalized: any = {};
  for (const key of Object.keys(row)) {
    normalized[normalizeKey(key)] = row[key];
  }
  return normalized;
}

function getRowValue(row: any, ...keys: string[]) {
  for (const key of keys) {
    const value = extractCellValue(row[normalizeKey(key)]);
    if (value === undefined || value === null) continue;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed !== "") return trimmed;
    } else {
      return value;
    }
  }
  return undefined;
}

function getCategoryValue(row: any) {
  const raw =
    row.category ??
    row.Category ??
    row.Categoria ??
    row.CATEGORIA ??
    row.Categoría ??
    row.CATEGORÍA ??
    row.Categories ??
    row.categories ??
    row.categoryName ??
    row.categoryname ??
    row["category name"] ??
    row["Category Name"] ??
    row["categoria "] ??
    row["Categoria "] ??
    row["CATEGORIA "];

  if (raw === undefined || raw === null) {
    return null;
  }

  const value = String(raw).trim();
  return value === "" ? null : value;
}

function getCategoryIdValue(row: any) {
  const raw =
    row.categoriesID ??
    row.categoriesId ??
    row.categoryID ??
    row.categoryId ??
    row.category_id ??
    row.categories_id ??
    row["categoriesID "] ??
    row["category ID"] ??
    row["category id"];

  if (raw === undefined || raw === null || raw === "") {
    return null;
  }

  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function resolveCategoryId(row: any) {
  const explicitId = getCategoryIdValue(row);
  if (explicitId) {
    const existingCategory = await prisma.category.findUnique({
      where: { id: explicitId }
    });
    if (existingCategory) {
      return existingCategory.id;
    }
  }

  const categoryName = getCategoryValue(row) || "General";
  const category = await prisma.category.upsert({
    where: { name: categoryName },
    update: {},
    create: { name: categoryName }
  });

  return category.id;
}

router.post(
  "/",
  requireAuth,   // 🔐 token
  requireAdmin,  // 🔐 solo admin
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      // 🛑 validar archivo
      if (!req.file) {
        return res.status(400).json({ error: "No se envió archivo" });
      }

      // 📖 leer excel
      const workbook = XLSX.readFile(req.file.path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);

      let created = 0;
      let updated = 0;
      let errors = 0;

      for (const rawRow of data as any[]) {
        const row = normalizeRow(rawRow);
        try {
          const codigo = String(getRowValue(row, "codigo", "cod", "codigo de barras", "barcode", "bar code", "bar_code") ?? "").trim();
          if (!codigo) {
            errors++;
            continue;
          }

          const descriptionRaw = getRowValue(row, "descripcion", "Descripcion", "Descripción", "description", "Description", "desc");
          const priceRaw = getRowValue(row, "precio", "Precio", "PRECIO", "price", "Price", "PRICE", "valor", "Valor", "VALOR", "unit price", "Unit Price", "unit_price", "precio_unitario", "precio unitario", "unitprice");
          const stockRaw = getRowValue(row, "stock", "Stock", "STOCK", "cantidad", "Cantidad");
          const imageRaw = getRowValue(row, "imagen", "Imagen", "image", "Image", "image_url", "Image_URL", "Image URL", "imagen_url", "Imagen URL", "url", "URL", "imageUrl", "ImageUrl", "link", "Link");

          const categoryId = await resolveCategoryId(row);

          const productoData = {
            name: String(getRowValue(row, "nombre", "Nombre", "name", "Name") ?? "Sin nombre").trim() || "Sin nombre",
            description: descriptionRaw ? String(descriptionRaw).slice(0, 10000) : null,
            price: parsePrice(priceRaw),
            stock: Math.floor(Number(stockRaw ?? 0)),
            image: normalizeUrl(imageRaw),
            isActive: true,
            barcode: codigo,
            categoryId
          };

          const existing = await prisma.product.findUnique({
            where: { barcode: codigo }
          });

          if (existing) {
            await prisma.product.update({
              where: { barcode: codigo },
              data: productoData
            });
            updated++;
          } else {
            await prisma.product.create({
              data: productoData
            });
            created++;
          }

        } catch (err) {
          console.error("Error fila:", row, err);
          errors++;
        }
      }

      return res.json({
        message: "Importación completada 🚀",
        resumen: {
          creados: created,
          actualizados: updated,
          errores: errors
        }
      });

    } catch (err) {
      console.error("Error general:", err);
      return res.status(500).json({
        error: "Error procesando el archivo"
      });
    }
  }
);

export default router;