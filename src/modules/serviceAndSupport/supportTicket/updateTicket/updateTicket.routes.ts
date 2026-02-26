import { Router } from "express";
import { UpdateTicketController } from "./updateTicket.controller.js";
import { authenticate } from "../../../../middleware/auth.middleware.js";

const router = Router();

router.put("/updateTicket/:id", authenticate, UpdateTicketController.update);

export default router;
