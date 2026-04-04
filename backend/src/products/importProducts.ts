import { Router, Request, Response } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import prisma from "../database/prisma";
import { requireAuth, requireAdmin } from "../middleware/auth_middleware";

const router = Router();
const upload = multer({ dest: "uploads/" });

// 🔧 helpers
function parsePrice(price: any): number {
  return Number(price?.toString().replace(/,/g, "") || 0);
}

function isValidUrl(url: any): boolean {
  return typeof url === "string" && url.startsWith("http");
}

function getRowValue(row: any, ...keys: string[]) {
  for (const key of keys) {
    const value = row[key];
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
    row['categoria '] ??
    row['Categoria '] ??
    row['CATEGORIA '];

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
    row['categoriesID '] ??
    row['category ID'] ??
    row['category id'];

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
  requireAuth,
  requireAdmin,
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No se envió archivo" });
      }

      const workbook = XLSX.readFile(req.file.path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);

      let created = 0;
      let updated = 0;
      let errors = 0;

      for (const row of data as any[]) {
        try {
          const codigo = String(getRowValue(row, "codigo", "Codigo", "CODIGO", "barcode", "Barcode", "BARCODE") ?? "").trim();
          if (!codigo) {
            errors++;
            continue;
          }

          const descriptionRaw = getRowValue(row, "descripcion", "Descripcion", "Descripción", "description", "Description");
          const priceRaw = getRowValue(row, "precio", "Precio", "price", "Price");
          const stockRaw = getRowValue(row, "stock", "Stock", "STOCK");
          const imageRaw = getRowValue(row, "imagen", "Imagen", "image", "Image");

          const stock = Number(stockRaw ?? 0);
          const categoryId = await resolveCategoryId(row);
          console.log("📂 Procesando categoría ID:", categoryId);

          const productoData = {
            name: String(getRowValue(row, "nombre", "Nombre", "name", "Name") ?? "Sin nombre").trim() || "Sin nombre",
            description: descriptionRaw ? String(descriptionRaw).slice(0, 10000) : null,
            price: parsePrice(priceRaw),
            stock,
            image: isValidUrl(imageRaw) ? String(imageRaw) : null,
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
          console.error("❌ Error fila:", row, err);
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
      console.error("💥 Error general:", err);
      return res.status(500).json({
        error: "Error procesando el archivo"
      });
    }
  }
);

export default router;