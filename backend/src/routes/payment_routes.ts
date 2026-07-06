import { Router } from "express";
import { initiatePayment, confirmPayment, rollbackPayment, getConfirmation, getOrderStatus } from "../controllers/payment_controller";

const router = Router();

router.post("/initiate", initiatePayment);
router.post("/confirm", confirmPayment);
router.get("/confirm", (_, res) => res.json({ status: "success" }));
router.post("/rollback", rollbackPayment);
router.post("/get-confirmation", getConfirmation);
router.get("/status/:orderId", getOrderStatus);

export default router;
