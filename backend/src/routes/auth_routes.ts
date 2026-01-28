import { Router } from "express";
import { login, me } from "../controllers/auth_controller";
import { requireAuth, requireAdmin } from "../middleware/auth_middleware";

const router = Router();

router.post("/login", login);
router.get("/me", requireAuth, requireAdmin, me);

export default router;