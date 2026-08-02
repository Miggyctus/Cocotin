import { Router } from "express";
import { createProduct, getProducts, toggleProduct, getProductById, updateProduct, applyCategoryDiscount } from "./product_controller";
import { requireAuth, requireAdmin } from "../middleware/auth_middleware";
import { upload } from "../middleware/upload";

const router = Router();

router.get("/", getProducts);

router.patch("/category-discount", requireAuth, requireAdmin, applyCategoryDiscount);

router.patch("/:id/toggle", requireAuth, requireAdmin, toggleProduct);

router.get("/:id", getProductById);

router.put(
  "/:id",
  requireAuth,
  requireAdmin,
  upload.single("image"),
  updateProduct
);

router.post(
  "/",
  requireAuth,
  requireAdmin,
  upload.single("image"), // 👈 CLAVE
  createProduct
);

export default router;
