import { Router } from "express";
import { getRevenueController } from "./revenue.controller.js";

const router = Router();

router.get("/revenue", getRevenueController);

export default router;