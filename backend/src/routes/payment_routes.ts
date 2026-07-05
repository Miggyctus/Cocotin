import { Router } from "express";
import { initiatePayment, confirmPayment } from "../controllers/payment_controller";

const router = Router();

router.post("/initiate", initiatePayment);
router.post("/confirm", confirmPayment);

export default router;
