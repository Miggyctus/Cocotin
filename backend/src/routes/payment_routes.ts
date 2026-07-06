import { Router } from "express";
import { initiatePayment, confirmPayment, rollbackPayment, getConfirmation } from "../controllers/payment_controller";

const router = Router();

router.post("/initiate", initiatePayment);
router.post("/confirm", confirmPayment);
router.post("/rollback", rollbackPayment);
router.post("/get-confirmation", getConfirmation);

export default router;
