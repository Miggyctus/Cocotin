import { Router } from "express";
import { createProduct, getProducts , toggleProduct } from "./product_controller";
import { requireAuth, requireAdmin } from "../middleware/auth_middleware";
import { upload } from "../middleware/upload";

const router = Router();

router.get("/", getProducts);

router.patch("/:id/toggle", requireAuth, requireAdmin, toggleProduct);

router.post(
  "/",
  requireAuth,
  requireAdmin,
  upload.single("image"), // 👈 CLAVE
  createProduct
);

export default router;
