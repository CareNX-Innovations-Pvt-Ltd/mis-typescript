import { Router } from "express";
import { getRevenueController } from "./revenue.controller.js";

const router = Router();

router.get("/", getRevenueController);

export default router;