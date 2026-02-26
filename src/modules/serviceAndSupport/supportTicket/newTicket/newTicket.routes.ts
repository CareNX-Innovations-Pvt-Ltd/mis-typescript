import { Router } from "express";
import { NewTicketController } from "./newTicket.controller.js";
import { authenticate } from "../../../../middleware/auth.middleware.js";

const router = Router();

router.post("/newTicket", authenticate, NewTicketController.create);
export default router;