import { Router } from "express";
import { DistributorController } from "./distributors.controller.js";
import { authenticate } from "../../../middleware/auth.middleware.js";

const router = Router();

router.post("/", authenticate, DistributorController.create);
export default router;